// 消息类型
const MSG_TYPE_TEXT = 1 // 文本
const MSG_TYPE_IMG = 2 // 图片
const MSG_TYPE_TRANSFER = 3 // 转账
const MSG_TYPE_VOICE = 4 // 语音
const MSG_TYPE_VIDEO = 5 // 视频
const MSG_TYPE_FILE = 6 // 文件

// 转账类型
const TRANSFER_PUBLISH = 1 // 发布
const TRANSFER_RECEIVE = 2 // 接收

// 消息来自
const MSG_FROM_SELF = 1
const MSG_FROM_OPPOSITE = 2

module.exports = {
  // 消息类型
  MSG_TYPE_TEXT,
  MSG_TYPE_IMG,
  MSG_TYPE_TRANSFER,
  MSG_TYPE_VOICE,
  MSG_TYPE_VIDEO,
  MSG_TYPE_FILE,
  // 转账类型
  TRANSFER_PUBLISH,
  TRANSFER_RECEIVE,
  // 消息来自
  MSG_FROM_SELF,
  MSG_FROM_OPPOSITE
}
