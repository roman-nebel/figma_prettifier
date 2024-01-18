const UIOptions = { width: 300, height: 645 };

figma.showUI(__html__, UIOptions);

let emptyFrames: FrameNode[] = []

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
  emptyFrames = frames.filter((frame) => frame.children.length === 0)

  const shapes = figma.currentPage.findAllWithCriteria({ types: ['RECTANGLE', 'LINE', 'VECTOR', 'ELLIPSE', 'POLYGON', 'STAR'] })
  const defaultShapes = shapes.filter((shape) => shape.name.match(/Rectangle\s[0-9]+|Line\s[0-9]+|Arrow\s[0-9]+|Ellipse\s[0-9]+|Polygon\s[0-9]+|Star\s[0-9]+/))

  const instances = figma.currentPage.findAllWithCriteria({ types: ['INSTANCE'] })
  const defaultInstances = instances.filter((frame) => frame.name === frame?.mainComponent?.name)

  SendToUI({
    action: "SEND_COUNTERS",
    data: {
      totalFrames: frames.length,
      defaultFrames: defaultFrames.length,
      emptyFrames: emptyFrames.length,
      totalShapes: shapes.length,
      defaultShapes: defaultShapes.length,
      totalInstances: instances.length,
      defaultInstances: defaultInstances.length
    }
    
  })
}

figma.ui.onmessage = msg => {
  if (msg.action === 'UPDATE_COUNTERS') {
    getDefaultNamedLayers()
  }
  if (msg.action === 'SELECT_ITEM') {
    if (emptyFrames.length) {
      const nextFrame = emptyFrames[0]
      figma.currentPage.selection = [nextFrame];
      figma.viewport.scrollAndZoomIntoView([nextFrame])
    }
  }
};