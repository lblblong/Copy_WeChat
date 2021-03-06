<template>
  <div id="chat">
    <chat-header class="chat_header" style="-webkit-app-region: drag">
    </chat-header>

    <div class="chat_body">
      <div class="chat_window" ref="chatWindow">
        <div class="message" v-for="(msg,index) in getNowChat().msgs" :key="index">
          <div class="sys_msg" v-if="msg.from == constant.MSG_FROM_SYSTEM">
            <span @click="delMsg(msg.id)">{{msg.data}}</span>
          </div>
          <div v-else :class="getClass(msg.from)">
            <img @click="delMsg(msg.id)" v-if="msg.from == constant.MSG_FROM_OPPOSITE" :src="nowChat.avatar" alt="">

            <!-- 文字消息 -->
            <message-text v-if="msg.type == constant.MSG_TYPE_TEXT" :direction="msg.from" :msg="msg.data"></message-text>

            <!-- 图片消息 -->
            <message-img-l v-if="msg.type == constant.MSG_TYPE_IMG && msg.from == constant.MSG_FROM_OPPOSITE" :src="msg.data"></message-img-l>
            <message-img-r v-if="msg.type == constant.MSG_TYPE_IMG && msg.from == constant.MSG_FROM_SELF" :src="msg.data"></message-img-r>

            <!-- 视频消息 -->
            <message-video-l v-if="msg.type == constant.MSG_TYPE_VIDEO && msg.from == constant.MSG_FROM_OPPOSITE" :data="msg.data"></message-video-l>
            <message-video-r v-if="msg.type == constant.MSG_TYPE_VIDEO && msg.from == constant.MSG_FROM_SELF" :data="msg.data"></message-video-r>

            <!-- 转账消息 -->
            <message-transfer @click.native="openTransferWindow(msg)" v-if="msg.type == constant.MSG_TYPE_TRANSFER" :direction="msg.from" :data="msg.data"></message-transfer>

            <!-- 语言消息 -->
            <message-voice v-if="msg.type == constant.MSG_TYPE_VOICE" :direction="msg.from" :data="msg.data"></message-voice>

            <!-- 文件消息 -->
            <message-file v-if="msg.type == constant.MSG_TYPE_FILE" :direction="msg.from" :data="msg.data"></message-file>

            <!-- 语音通话消息 -->
            <message-call-voice v-if="msg.type == constant.MSG_TYPE_VOICE_CALL" :direction="msg.from" :data="msg.data"></message-call-voice>

            <!-- 视频通话消息 -->
            <message-call-video v-if="msg.type == constant.MSG_TYPE_VIDEO_CALL" :direction="msg.from" :data="msg.data"></message-call-video>

            <img @click="delMsg(msg.id)" v-if="msg.from == constant.MSG_FROM_SELF" :src="self.avatar" alt="">
          </div>
        </div>
      </div>
    </div>

    <footer>
      <div class="toolbar">
        <div>
          <span @click="expressionShow"><span class="icon-emoji"></span></span>
          <span><span class="icon-file"></span></span>
          <span><span class="icon-cut"></span></span>
          <span><span class="icon-message"></span></span>
        </div>
        <div>
          <span><span class="icon-call_1"></span></span>
          <span><span class="icon-video_1"></span></span>
        </div>
      </div>
      <div>
        <textarea rows="3" v-model="message" @keyup.enter="submit"></textarea>
      </div>
      <div class="sent_warp">
        <button @click="submit">发送(S)</button>
      </div>
    </footer>

    <dialog-expression :event="event_expression"></dialog-expression>
  </div>
</template>

<script>
import EventEmitter from 'eventemitter3'
const ipcRenderer = require('electron').ipcRenderer
import { Message } from 'element-ui'
import dayjs from 'dayjs'
import { mapGetters, mapMutations } from 'vuex'

import constant from '../constant.js'
import ChatHeader from './chat_header'
import MessageText from './messages/message_text'
import MessageImgR from './messages/message_img_r'
import MessageImgL from './messages/message_img_l'
import MessageTransfer from './messages/message_transfer'
import MessageVoice from './messages/message_voice'
import MessageVideoR from './messages/message_video_r'
import MessageVideoL from './messages/message_video_l'
import MessageFile from './messages/message_file'
import MessageCallVoice from './messages/message_call_voice'
import MessageCallVideo from './messages/message_call_video'

import DialogExpression from './dialogs/expression'

export default {
  components: {
    ChatHeader,
    MessageText,
    MessageImgR,
    MessageImgL,
    MessageTransfer,
    MessageVoice,
    MessageVideoR,
    MessageVideoL,
    MessageFile,
    MessageCallVoice,
    MessageCallVideo,
    DialogExpression
  },
  computed: {
    ...mapGetters(['nowChat', 'self', 'nowUser'])
  },
  data() {
    return {
      message: '',
      constant: constant,
      event_expression: null
    }
  },
  created() {
    this.event_expression = new EventEmitter()
    this.event_expression.on('selExpression', this.selExpression)

    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.keyCode == 83) {
        this.changeUser(constant.MSG_FROM_SELF)
      } else if (e.ctrlKey && e.keyCode == 79) {
        this.changeUser(constant.MSG_FROM_OPPOSITE)
      }
    })

    window.globalEvent.on('pubmsg', this.onPubmsgListener)
  },
  methods: {
    ...mapMutations(['pushMessage', 'changeNowUser', 'delMsg']),
    getClass(from) {
      return from == constant.MSG_FROM_SELF ? 'self' : 'opposite'
    },
    getNowChat() {
      return this.nowChat
    },
    submit() {
      if (!this.message) return
      this.message = this.messageTransferHTML(this.message)
      this.pushMessage({
        chat_id: this.nowChat.id,
        id: this.nowChat.msgs.length,
        type: constant.MSG_TYPE_TEXT,
        from: this.nowUser,
        data: this.message,
        time: dayjs().format('HH:mm')
      })
      this.message = ''
    },
    onPubmsgListener() {
      this.$nextTick(() => {
        this.$refs.chatWindow.scrollTop =
          this.$refs.chatWindow.scrollHeight + 100
      }, 0)
    },
    // 转账点击
    transferClick(msg) {
      if (msg.data.type != constant.TRANSFER_PUBLISH) {
        this.transfer.step = 2
      } else {
        this.transfer.step = 1
      }
      this.transfer.now = msg
      this.transfer.show = true
      console.log(this.transfer.now)
    },
    changeUser(user) {
      this.changeNowUser(user)
      if (user == constant.MSG_FROM_SELF) {
        Message.success(`已切换为自己`)
      } else {
        Message.success(`已切换为对方`)
      }
    },
    openTransferWindow(msg) {
      ipcRenderer.removeAllListeners('transfer_on_msg')
      ipcRenderer.once('transfer_on_msg', (event, _msg) => {
        _msg = JSON.parse(_msg)
        _msg.chat_id = this.nowChat.id
        _msg.id = this.nowChat.msgs.length
        this.pushMessage(_msg)
        msg.data.receive_time = _msg.data.receive_time
      })
      console.log('发送转账消息', msg)
      ipcRenderer.send('open_transfer_window', JSON.stringify(msg))
    },
    expressionShow() {
      this.event_expression.emit('open')
    },
    selExpression(expression) {
      this.message = this.message + `[i-${expression.index}]`
    },
    messageTransferHTML(str) {
      let strs = str.split('[i-')
      let result = []
      for (let i = 0; i < strs.length; i++) {
        let cons = strs[i].split(']')
        if (cons.length == 2) {
          result.push({
            content: cons[0],
            expression: true
          })
          result.push({
            content: cons[1],
            expression: false
          })
        } else {
          cons.forEach(it => {
            result.push({
              content: it,
              expression: false
            })
          })
        }
      }
      let rep = ''
      result.forEach(it => {
        console.log(it)
        if (it.expression) {
          let img = window.expressions.find(itt => {
            return itt.index == it.content
          })
          console.log(img)
          rep = rep + `<img src="${img.img}" style="width:24px;height:24px;margin: 0 3px;"/>`
        } else {
          rep = rep + it.content
        }
      })
      console.log(rep)
      return rep
    }
  }
}
</script>

<style scoped lang="scss">
#chat {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  .chat_header {
    height: 60px;
  }

  .chat_body {
    flex: 1;
    overflow-y: hidden;
    overflow-x: hidden;
    .chat_window {
      height: 100%;
      width: calc(100% + #{17px});
      overflow-y: scroll;
      padding: 0px;
      margin: 0px;
      > .message:last-of-type {
        margin-bottom: 8px;
      }
    }
    .opposite,
    .self {
      display: flex;
      padding: 0 28px;
      margin-top: 15px;
      img {
        width: 35px;
        height: 35px;
        cursor: pointer;
      }
    }
    .opposite {
      justify-content: flex-start;
      img {
        margin-right: 8px;
      }
    }
    .self {
      justify-content: flex-end;
      img {
        margin-left: 8px;
      }
    }
    .sys_msg {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 15px;
      > span {
        cursor: pointer;
        font-size: 12px;
        color: #fff;
        background-color: #dadada;
        border-radius: 2px;
        padding: 3px 8px;
      }
    }
  }

  footer {
    height: 145px;
    background-color: white;
    border-top: 1px solid #e5e5e5;
    padding: 6px 15px;
    .toolbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      div {
        display: flex;
        align-items: center;
        > span {
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 34px;
          height: 30px;
          > span {
            font-size: 18px;
          }
          .icon-cut {
            font-size: 16px;
            font-weight: bold;
          }
          &:hover {
            background-color: #efefef;
          }
        }
      }
      div:last-child {
        .icon-call_1 {
          font-weight: 100;
          font-size: 20px;
        }
        .icon-video_1 {
          font-weight: 500;
          font-size: 22px;
        }
      }
    }
    textarea {
      width: 100%;
      height: 100%;
      resize: none;
      border: none;
      outline: none;
      font-size: 14px;
      font-weight: 500px;
      padding: 8px;
    }
    .sent_warp {
      display: flex;
      justify-content: flex-end;
      button {
        width: 68px;
        height: 26px;
        border: 1px solid #e5e5e5;
        background-color: #f5f5f5;
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }
      button:hover {
        background-color: #129611;
        color: #fff;
      }
    }
  }
}
</style>