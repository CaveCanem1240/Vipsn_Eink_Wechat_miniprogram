const app = getApp()
Page({
  data: {
    searching: false,
    NUSservices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
    devicesList: [],

    inputText: app.globalData.inputText,//'Hello World!',
    receiveText: '',
    name: '',
    connectedDeviceId: '',
    services: {},
    characteristics: {},
    connected: false,

    SendTimer: null
  },
  bindInput: function (e) {
    app.globalData.inputText = e.detail.value;
    //this.setData({
    //  inputText: e.detail.value
    //})
    console.log(e.detail.value)
  },
  Send: function () {
    var that = this
    if (that.data.connected) {
      var buffer = new ArrayBuffer(app.globalData.inputText.length)
      var buffer = new ArrayBuffer(app.globalData.inputText.length)
      var dataView = new Uint8Array(buffer)
      for (var i = 0; i < app.globalData.inputText.length; i++) {
        dataView[i] = app.globalData.inputText.charCodeAt(i)
      }

      wx.writeBLECharacteristicValue({
        deviceId: that.data.connectedDeviceId,
        serviceId: that.data.services[0].uuid,
        characteristicId: that.data.characteristics[0].uuid,
        value: buffer,
        success: function (res) {
          console.log('发送成功')
        }
      })
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },

  Scan: function (options) {
    var that = this
    if (!that.data.searching) {
      wx.closeBluetoothAdapter({
        complete: function (res) {
          console.log(res)
          wx.openBluetoothAdapter({
            success: function (res) {
              console.log(res)
              wx.getBluetoothAdapterState({
                success: function (res) {
                  console.log(res)
                }
              })
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                services: that.data.NUSservices,
                //services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
                success: function (res) {
                  console.log(res)
                  that.setData({
                    searching: true,
                    devicesList: []
                  })
                }
              })
            },
            fail: function (res) {
              console.log(res)
              wx.showModal({
                title: '提示',
                content: '请检查手机蓝牙是否打开',
                showCancel: false,
                success: function (res) {
                  that.setData({
                    searching: false
                  })
                }
              })
            }
          })
        }
      })
    }
    else {
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log(res)
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  Connect: function (e) {
    var that = this
    var advertisData, name
    console.log("try connect\n", e.currentTarget)
    for (var i = 0; i < that.data.devicesList.length; i++) {
      if (e.currentTarget.id == that.data.devicesList[i].deviceId) {
        name = that.data.devicesList[i].name
        advertisData = that.data.devicesList[i].advertisData
      }
    }
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        console.log(res)
        that.setData({
          searching: false
        })
      }
    })
    wx.showLoading({
      title: '连接蓝牙设备中...',
    })
    wx.createBLEConnection({
      deviceId: e.currentTarget.id,
      success: function (res) {
        console.log(res)
        /*
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })*/
        that.setData({
          connected: true,
          connectedDeviceId: e.currentTarget.id,
          name: name
        })
        wx.nextTick(() => {
          that.ConnectReady()
        })
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    })
  },
  ConnectReady: function(){
    var that= this
    that.SendTimer = setTimeout(function(){
      if(that.data.connected){
        console.log(that.data.connectedDeviceId),
        wx.getBLEDeviceServices({
          deviceId: that.data.connectedDeviceId,
          success: function (res) {
            console.log("getBLEDeviceServices success\n",res.services)
            that.setData({
              services: res.services
            })
            wx.getBLEDeviceCharacteristics({
              deviceId: that.data.connectedDeviceId,
              serviceId: res.services[0].uuid,
              success: function (res) {
                console.log("getBLEDeviceCharacteristics success\n",res.characteristics)
                that.setData({
                  characteristics: res.characteristics
                })
                console.log("try notifyBLECharacteristicValueChange\n", that.data)
                wx.notifyBLECharacteristicValueChange({
                  state: true,
                  deviceId: that.data.connectedDeviceId,
                  serviceId: that.data.services[0].uuid,
                  characteristicId: that.data.characteristics[1].uuid,
                  success: function (res) {
                    console.log('启用notify成功')
                    
                    var buffer = new ArrayBuffer(app.globalData.inputText.length)
                    var dataView = new Uint8Array(buffer)
                    for (var i = 0; i < app.globalData.inputText.length; i++) {
                      dataView[i] = app.globalData.inputText.charCodeAt(i)
                    }
                    console.log("try writeBLECharacteristicValue\n", that.data)
                    wx.writeBLECharacteristicValue({
                      deviceId: that.data.connectedDeviceId,
                      serviceId: that.data.services[0].uuid,
                      characteristicId: that.data.characteristics[0].uuid,
                      value: buffer,
                      success: function (res) {
                        console.log('发送成功')
                        clearTimeout(that.SendTimer)
                        wx.hideLoading()
                        wx.showToast({
                          title: '发送成功',
                          icon: 'success',
                          duration: 2000
                        })
                        wx.closeBLEConnection({
                          deviceId: that.data.connectedDeviceId
                        })
                      }
                    })
                  },
                  fail: function(res){
                    console.log("notifyBLECharacteristicValueChange Failed",res)
                  }
                })
              },
              fail: function(res) {
                console.log("getBLEDeviceCharacteristics Failed",res)
              }
            })
          },
          fail: (res) => {
            console.log("getBLEDeviceServices Failed",res)
          }
        })
        wx.onBLEConnectionStateChange(function (res) {
          console.log(res)
          that.setData({
            connected: res.connected
          })
        })
        wx.onBLECharacteristicValueChange(function (res) {
          var receiveText = app.buf2string(res.value)
          console.log('接收到数据：' + receiveText)
          that.setData({
            receiveText: receiveText
          })
        })
        
      }
      else{
        console.log("connection not ready",that)
      }
    },1000)
    

  },
  onLoad: function (options) {
    var that = this
    var list_height = ((app.globalData.SystemInfo.windowHeight - 50) * (750 / app.globalData.SystemInfo.windowWidth)) - 60
    that.setData({
      list_height: list_height
    })
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(res)
      that.setData({
        searching: res.discovering
      })
      if (!res.available) {
        that.setData({
          searching: false
        })
      }
    })
    wx.onBluetoothDeviceFound(function (devices) {
      //剔除重复设备，兼容不同设备API的不同返回值
      var isnotexist = true
      if (devices.deviceId) {
        if (devices.advertisData)
        {
          devices.advertisData = app.buf2hex(devices.advertisData)
        }
        else
        {
          devices.advertisData = ''
        }
        console.log(devices)
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices)
        }
      }
      else if (devices.devices) {
        if (devices.devices[0].advertisData)
        {
          devices.devices[0].advertisData = app.buf2hex(devices.devices[0].advertisData)
        }
        else
        {
          devices.devices[0].advertisData = ''
        }
        console.log(devices.devices[0])
        for (var i = 0; i < that.data.devicesList.length; i++) {
          if (devices.devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices.devices[0])
        }
      }
      else if (devices[0]) {
        if (devices[0].advertisData)
        {
          devices[0].advertisData = app.buf2hex(devices[0].advertisData)
        }
        else
        {
          devices[0].advertisData = ''
        }
        console.log(devices[0])
        for (var i = 0; i < devices_list.length; i++) {
          if (devices[0].deviceId == that.data.devicesList[i].deviceId) {
            isnotexist = false
          }
        }
        if (isnotexist) {
          that.data.devicesList.push(devices[0])
        }
      }
      that.setData({
        devicesList: that.data.devicesList
      })
    })
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  }
})