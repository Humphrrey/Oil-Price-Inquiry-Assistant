// pages/estimate/estimate.js - 花费估算
Page({
  data: {
    selectedRegion: '陕西',
    fuelType: '92',      // 92 / 95 / 0
    fuelTypeName: '92#汽油',
    price: null,          // 当前油价
    distance: '',         // 行驶里程(km)
    consumption: '',       // 百公里油耗(L)
    result: null,         // 计算结果
    dataSource: null,
    fuelTypes: [
      { key: '0', label: '0#柴油', unit: '元/升' },
      { key: '92', label: '92#汽油', unit: '元/升' },
      { key: '95', label: '95#汽油', unit: '元/升' },
      { key: '98', label: '98#汽油', unit: '元/升' }
    ]
  },

  onLoad() {
    this.loadCurrentPrice();
  },

  onShow() {
    // 每次显示页面时刷新油价
    this.loadCurrentPrice();
  },

  // 从缓存读取当前油价
  loadCurrentPrice() {
    const region = this.data.selectedRegion || '陕西';
    try {
      const cached = wx.getStorageSync(`oilCache_${region}`);
      if (cached) {
        const data = JSON.parse(cached);
        this.setData({ price: data[this.getPriceKey()] });
      }
    } catch (e) { }
  },

  getPriceKey() {
    const map = { '0': 'p0', '92': 'p92', '95': 'p95', '98': 'p98' };
    return map[this.data.fuelType] || 'p92';
  },

  // 切换油品
  onFuelTypeChange(e) {
    const index = parseInt(e.detail.value);
    const type = this.data.fuelTypes[index];
    this.setData({
      fuelType: type.key,
      fuelTypeName: type.label,
      result: null
    });
    this.loadCurrentPrice();
  },

  // 输入里程
  onDistanceInput(e) {
    this.setData({ distance: e.detail.value });
  },

  // 输入油耗
  onConsumptionInput(e) {
    this.setData({ consumption: e.detail.value });
  },

  // 计算
  onCalc() {
    const { price, distance, consumption } = this.data;
    const dist = parseFloat(distance);
    const cons = parseFloat(consumption);

    if (!price) {
      wx.showToast({ title: '油价未加载', icon: 'none' }); return;
    }
    if (!dist || dist <= 0) {
      wx.showToast({ title: '请输入行驶里程', icon: 'none' }); return;
    }
    if (!cons || cons <= 0) {
      wx.showToast({ title: '请输入百公里油耗', icon: 'none' }); return;
    }

    const fuelUsed = (dist / 100) * cons;       // 总油耗(升)
    const totalCost = fuelUsed * price;          // 总花费(元)
    const costPerHundred = cons * price;         // 百公里花费(元)
    const costPerKm = totalCost / dist;  // 每公里花费

    this.setData({
      result: {
        fuelUsed: fuelUsed.toFixed(2),
        totalCost: totalCost.toFixed(2),
        costPerHundred: costPerHundred.toFixed(2),
        costPerKm: costPerKm.toFixed(2)  // 新增
      }
    });
  },

  // 清除
  onClear() {
    this.setData({ distance: '', consumption: '', result: null });
  }
});
