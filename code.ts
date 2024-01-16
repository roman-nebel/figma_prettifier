const UIOptions = { width: 300, height: 210 };

figma.showUI(__html__, UIOptions);

type UIMessage = {
  action: "SEND_FRAME_COUNTER"
  counter?: number
}

function SendToUI(msg: UIMessage) {
  figma.ui.postMessage(msg)
}

function getDefaultNamedLayers() {
  const layers = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] })
  const defaultLayers = layers.filter((layer) => layer.name.match(/Frame [0-9]+/))

  SendToUI({
    action: "SEND_FRAME_COUNTER",
    counter: defaultLayers.length
  })
}

figma.ui.onmessage = msg => {
  if (msg.action === 'UPDATE_FRAME_COUNTER') {
    getDefaultNamedLayers()
  }
};

getDefaultNamedLayers()