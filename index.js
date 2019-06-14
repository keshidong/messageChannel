import { makeid } from './index'

const genOneWayChannelId = (channelName, sendPortId, recvPortId) => (
  `${channelName}:${sendPortId}--->${recvPortId}`
)

const index = (config = { domain: 'default' }) => {
  const channelName = `${config.domain}-channel-${makeid(4)}`
  const port1Id = `port-${makeid(3)}`
  const port2Id = `port-${makeid(3)}`

  window.localStorage.setItem(
    channelName,
    JSON.stringify([
      genOneWayChannelId(channelName, port1Id, port2Id),
      genOneWayChannelId(channelName, port2Id, port1Id)
    ])
  )

  window.addEventListener('unload', () => {
    // clear ls
    // 清除元数据
    window.localStorage.removeItem(channelName)

    // 清除两条通信通道
    window.localStorage.removeItem(genOneWayChannelId(channelName, port1Id, port2Id))
    window.localStorage.removeItem(genOneWayChannelId(channelName, port2Id, port1Id))
  })

  return {
    port1: Port(stringifyPort({ channelName, channelIndex: 0 })),
    port2: Port(stringifyPort({ channelName, channelIndex: 1 }))
  }
}

function stringifyPort (port) {
  const { channelName, channelIndex } = port
  return window.btoa(JSON.stringify([ channelName, channelIndex ]))
}

export const Port = (portString) => {
  // todo:安全检查
  let channelName, channelIndex, portChannelIds, sendChannelId, recvChannelId
  try {
    [ channelName, channelIndex ] = JSON.parse(window.atob(portString))
    portChannelIds = JSON.parse(window.localStorage.getItem(channelName))

    sendChannelId = portChannelIds[channelIndex]
    recvChannelId = portChannelIds[1 - channelIndex]

    if (!(sendChannelId && recvChannelId)) {
      throw new Error('message port not vaild')
    }
  } catch (e) {
    console.error(e)

    return null
  }

  return {
    send (data) {
      try {
        window.localStorage.setItem(sendChannelId, JSON.stringify(data))

        return true
      } catch (e) {
        console.error(e)
        return false
      }
    },

    recv () {
      try {
        return JSON.parse(window.localStorage.getItem(recvChannelId))
      } catch (e) {
        console.error(e)
        return null
      }
    },

    toString () {
      return stringifyPort({ channelName, channelIndex })
    }
  }
}

export default index
