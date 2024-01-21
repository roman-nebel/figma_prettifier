type PageTypes = {
  page: "index" | "rename"
}

const UIOptions = 
  {
    index: { width: 300, height: 680 },
    rename: { width: 300, height: 200 }
  };

figma.showUI(__uiFiles__.index, UIOptions.index);

let initState = true

let frames: FrameNode[] = []
let defaultFrames: FrameNode[] = []
let emptyFrames: FrameNode[] = []
let shapes: (RectangleNode | LineNode | VectorNode | EllipseNode | PolygonNode | StarNode)[] = []
let defaultShapes: (RectangleNode | LineNode | VectorNode | EllipseNode | PolygonNode | StarNode)[] = []
let instances: InstanceNode[] = []
let defaultInstances: InstanceNode[] = []

type UIMessage = {
  action: "SEND_COUNTERS" | "SEND_NAME"
  data: Object
  state?: boolean
}

function SendToUI(msg: UIMessage) {
  figma.ui.postMessage(msg)
}

function getDefaultNamedLayers() {
  frames = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] })
  defaultFrames = frames.filter((frame) => frame.name.match(/Frame [0-9]+/))
  emptyFrames = frames.filter((frame) => frame.children.length === 0)

  shapes = figma.currentPage.findAllWithCriteria({ types: ['RECTANGLE', 'LINE', 'VECTOR', 'ELLIPSE', 'POLYGON', 'STAR'] })
  defaultShapes = shapes.filter((shape) => shape.name.match(/Rectangle\s[0-9]+|Line\s[0-9]+|Arrow\s[0-9]+|Ellipse\s[0-9]+|Polygon\s[0-9]+|Star\s[0-9]+/))

  instances = figma.currentPage.findAllWithCriteria({ types: ['INSTANCE'] })
  defaultInstances = instances.filter((frame) => frame.name === frame?.mainComponent?.name)

  return {
    totalFrames: frames.length,
    defaultFrames: defaultFrames.length,
    emptyFrames: emptyFrames.length,
    totalShapes: shapes.length,
    defaultShapes: defaultShapes.length,
    totalInstances: instances.length,
    defaultInstances: defaultInstances.length
  }
}

figma.ui.onmessage = msg => {
  const { action } = msg
  if (action === 'UPDATE_COUNTERS') {
    const data = getDefaultNamedLayers()

    initState = false

    SendToUI({
      action: "SEND_COUNTERS",
      data,
      state: initState
    })
  }

  if (action === 'BACKGROUND_UPDATE_COUNTERS') {
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
      },
      state: initState
    })
  }

  if (action === 'CHANGE_PAGE') {
    const { page }: PageTypes = msg
    figma.showUI(__uiFiles__[page], UIOptions[page]);
  }

  if (action === 'DELETE_EMPTY') {
    for (const frame of emptyFrames) {
      frame.remove()
      emptyFrames = []
    }
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

  if (action === 'UPDATE_NAME') {
    const node = figma.currentPage.findOne((node) => node.id === defaultFrames[0].id)
    console.log(node)
    if (node) node.name = msg.newName
    console.log(node)
    
  }

  if (action === 'SELECT_ITEM') {
    const { newName } = msg

    if (newName) {
      const node = figma.currentPage.findOne((node) => node.id === defaultFrames[0].id)
      if (node) node.name = msg.newName
      defaultFrames.shift()
    }

    debugger

    if (defaultFrames.length) {
      const nextFrame = defaultFrames[0]
      figma.currentPage.selection = [nextFrame];
      figma.viewport.scrollAndZoomIntoView([nextFrame])
      SendToUI({
        action: "SEND_NAME",
        data: {
          name: nextFrame.name
        }
        
      })
    }
  }
};