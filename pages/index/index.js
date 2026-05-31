// pages/index/index.js - 首页（实时API优先 + 本地兜底）
const app = getApp();

// 天行数据API Key
const TIANXIN_APIKEY = 'XXXXXXXXXXXXXXXXXXXXXXX';

Page({
  data: {
    loading: true,
    p92: null,
    p95: null,
    p98: null,
    p0: null,
    time: null,
    changes: { p92: null, p95: null, p98: null, p0: null },
    countdown: null,
    nextAdjustDate: null,
    selectedRegion: '陕西',
    provIndex: 0,
    dataSource: null,
    regions: [
      '北京', '天津', '河北', '山西', '内蒙古',
      '辽宁', '吉林', '黑龙江',
      '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
      '河南', '湖北', '湖南',
      '广东', '广西', '海南',
      '重庆', '四川', '贵州', '云南', '西藏',
      '陕西', '甘肃', '青海', '宁夏', '新疆'
    ]
  },

  onLoad() {
    this.initCountdown();
    this._countdownTimer = setInterval(() => this.refreshCountdown(), 1000);
    this.loadOilPrice();
  },

  onUnload() {
    if (this._countdownTimer) clearInterval(this._countdownTimer);
  },

  onPullDownRefresh() {
    this.loadOilPrice();
    wx.stopPullDownRefresh();
  },

  loadOilPrice() {
    this.setData({ loading: true });

    this.fetchFromAPI(this.data.selectedRegion)
      .then(data => {
        this.applyOilData(data, 'api');
        this.cacheOilData(this.data.selectedRegion, data);
        this.setData({ loading: false });
      })
      .catch(err => {
        console.warn('[油价] API失败:', err.message);
        // 优先读缓存，其次读静态文件
        const cached = this.loadFromCache(this.data.selectedRegion);
        if (cached) {
          this.applyOilData(cached, 'local');
        } else {
          const data = this.loadFromLocal(this.data.selectedRegion);
          if (data) {
            this.applyOilData(data, 'local');
          } else {
            wx.showToast({ title: '数据加载失败', icon: 'none' });
          }
        }
        this.setData({ loading: false });
      });
  },

  // 从天行数据API获取油价
  fetchFromAPI(province) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://apis.tianapi.com/oilprice/index',
        data: { key: TIANXIN_APIKEY, prov: province },
        success: (res) => {
          const result = res.data;
          console.log('[油价API] 原始响应:', JSON.stringify(result));

          // 情况1: result.result.newslist 数组格式
          if (result && result.code === 200 && result.result) {
            const r = result.result;
            
            if (r.newslist && r.newslist[0]) {
              const item = r.newslist[0];
              resolve({
                p92: item.p92 || item['92'] || item.gasoline_92,
                p95: item.p95 || item['95'] || item.gasoline_95,
                p98: item.p98 || item['98'] || item.gasoline_98,
                p0: item.p0 || item.diesel_0,
                time: item.time || item.date
              });
              return;
            }
            
            // 情况2: result.result 直接是数据对象
            if (r.p92 || r['92'] || r.gasoline_92) {
              resolve({
                p92: r.p92 || r['92'] || r.gasoline_92,
                p95: r.p95 || r['95'] || r.gasoline_95,
                p98: r.p98 || r['98'] || r.gasoline_98,
                p0: r.p0 || r.diesel_0,
                time: r.time || r.date
              });
              return;
            }
          }

          // 情况3: 直接在 result 里（不是 result.result）
          if (result && result.code === 200 && result.p92) {
            resolve({
              p92: result.p92,
              p95: result.p95,
              p98: result.p98,
              p0: result.p0,
              time: result.time
            });
            return;
          }

          reject(new Error(result && result.msg ? result.msg : 'API返回格式未知'));
        },
        fail: (err) => {
          console.error('[油价API] 请求失败:', err);
          reject(err);
        }
      });
    });
  },

  // 从本地加载
  loadFromLocal(province) {
    try {
      const allData = require('../../oil_prices_data.js');
      const record = allData.find(item => item.region === province);
      if (record) {
        return {
          p92: record.gasoline_92,
          p95: record.gasoline_95,
          p98: record.gasoline_98,
          p0: record.diesel_0,
          time: record.date
        };
      }
      return null;
    } catch (err) {
      console.error('[本地数据] 加载异常:', err);
      return null;
    }
  },

  // 缓存API数据到本地存储
  cacheOilData(province, data) {
    try {
      wx.setStorageSync(`oilCache_${province}`, JSON.stringify(data));
    } catch (e) { console.error('缓存数据失败:', e); }
  },

  // 从缓存读取API数据
  loadFromCache(province) {
    try {
      const data = wx.getStorageSync(`oilCache_${province}`);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  applyOilData(data, source) {
    const region = this.data.selectedRegion;
    const lastPrices = this.getLastPrices(region);
    const newPrices = { p92: data.p92, p95: data.p95, p98: data.p98, p0: data.p0 };

    const changes = {};
    if (lastPrices) {
      changes.p92 = this.calcChange(newPrices.p92, lastPrices.p92);
      changes.p95 = this.calcChange(newPrices.p95, lastPrices.p95);
      changes.p98 = this.calcChange(newPrices.p98, lastPrices.p98);
      changes.p0 = this.calcChange(newPrices.p0, lastPrices.p0);
    } else {
      changes.p92 = changes.p95 = changes.p98 = changes.p0 = 0;
    }

    this.saveLastPrices(region, newPrices);

    // 第 187-190行：新增的时间处理代码
    // 处理时间格式，去掉毫秒部分
    let displayTime = data.time;
    if (displayTime && displayTime.includes('.')) {
  displayTime = displayTime.split('.')[0];
    }

    this.setData({
      p92: data.p92, p95: data.p95, p98: data.p98, p0: data.p0,
      time: displayTime, changes: changes, dataSource: source
    });
  },

  calcChange(current, previous) {
    if (!previous) return 0;
    return Math.round((parseFloat(current) - parseFloat(previous)) * 100) / 100;
  },

  getLastPrices(province) {
    try {
      const data = wx.getStorageSync(`lastPrice_${province}`);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },

  saveLastPrices(province, prices) {
    try {
      wx.setStorageSync(`lastPrice_${province}`, JSON.stringify(prices));
    } catch (e) { console.error('保存价格失败:', e); }
  },

  onRegionChange(e) {
    const index = parseInt(e.detail.value);
    const newRegion = this.data.regions[index];
    if (newRegion !== this.data.selectedRegion) {
      this.setData({ provIndex: index, selectedRegion: newRegion });
      this.loadOilPrice();
    }
  },

  // ==================== 下次调价倒计时 ====================
  // 2026年官方调价窗口日期（当日24时生效）
  ADJUST_DATES_2026: [
    '2026-01-06', '2026-01-20',
    '2026-02-03', '2026-02-24',
    '2026-03-09', '2026-03-23',
    '2026-04-07', '2026-04-21',
    '2026-05-08', '2026-05-21',
    '2026-06-04', '2026-06-18',
    '2026-07-03', '2026-07-17', '2026-07-31',
    '2026-08-14', '2026-08-28',
    '2026-09-11', '2026-09-24',
    '2026-10-15', '2026-10-29',
    '2026-11-12', '2026-11-26',
    '2026-12-10', '2026-12-24'
  ],

  initCountdown() {
    const now = new Date();
    const targetDate = this.getNextAdjustDate(now);
    const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    this.setData({ nextAdjustDate: dateStr });
    this.refreshCountdown();
  },

  getNextAdjustDate(from) {
    const year = from.getFullYear();
    // 使用官方固定日期表（仅2026年）
    const dates = year === 2026 ? this.ADJUST_DATES_2026 : this.generateAdjustDates(year);
    
    for (const dateStr of dates) {
      const adjustDate = new Date(dateStr);
      // 调价日24点前都算"未到"，返回该调价日
      if (from.getTime() < adjustDate.getTime() + 86400000) {
        return adjustDate;
      }
    }
    // 如果所有日期都过了，返回最后一个
    return new Date(dates[dates.length - 1]);
  },

  // 非2026年的备用生成逻辑（保持原有计算方式）
  generateAdjustDates(year) {
    const dates = [];
    for (let month = 0; month < 12; month++) {
      [6, 21].forEach(baseDay => {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(baseDay).padStart(2, '0')}`);
      });
    }
    return dates;
  },

  refreshCountdown() {
    const nextDateStr = this.data.nextAdjustDate;
    if (!nextDateStr) return;
    // 国内油价在调价日24点（即次日00:00）生效
    const targetDate = new Date(nextDateStr);
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(0, 0, 0, 0);
    const now = new Date();
    let diff = targetDate - now;
    if (diff <= 0) { this.setData({ countdown: '调价中...' }); return; }
    const days = Math.floor(diff / 86400000);
    diff %= 86400000;
    const hours = Math.floor(diff / 3600000);
    diff %= 3600000;
    const minutes = Math.floor(diff / 60000);
    diff %= 60000;
    const seconds = Math.floor(diff / 1000);
    this.setData({
      countdown: `${days}天 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    });
  },

  onShareAppMessage() {
    return { title: '今日油价查询', path: '/pages/index/index' };
  }
});
