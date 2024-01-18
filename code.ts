const UIOptions = { width: 300, height: 505 };

figma.showUI(__html__, UIOptions);

type UIMessage = {
  action: "SEND_COUNTERS"
  data: Object
}

function SendToUI(msg: UIMessage) {
  figma.ui.postMessage(msg)
}

function getDefaultNamedLayers() {
  const frames = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] })
  const defaultFrames = frames.filter((frame) => frame.name.match(/Frame [0-9]+/))

  const shapes = figma.currentPage.findAllWithCriteria({ types: ['RECTANGLE', 'LINE', 'VECTOR', 'ELLIPSE', 'POLYGON', 'STAR'] })
  const defaultShapes = shapes.filter((shape) => shape.name.match(/Rectangle\s[0-9]+|Line\s[0-9]+|Arrow\s[0-9]+|Ellipse\s[0-9]+|Polygon\s[0-9]+|Star\s[0-9]+/))

  console.log(defaultShapes.length)

  SendToUI({
    action: "SEND_COUNTERS",
    data: {
      totalFrames: frames.length,
      defaultFrames: defaultFrames.length,
      totalShapes: shapes.length,
      defaultShapes: defaultShapes.length
    }
    
  })
}

figma.ui.onmessage = msg => {
  if (msg.action === 'UPDATE_COUNTERS') {
    getDefaultNamedLayers()
  }
};