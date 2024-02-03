type PageTypes = {
  page: "index" | "rename"
}

type PrimitiveNodes = Array<'RECTANGLE' | 'LINE' | 'VECTOR' | 'ELLIPSE' | 'POLYGON' | 'STAR'>

const UIOptions = 
  {
    index: { width: 300, height: 680 },
    rename: { width: 300, height: 200 }
  };

figma.showUI(__uiFiles__.index, UIOptions.index);

const PRIMITIVES: PrimitiveNodes = ['RECTANGLE', 'LINE', 'VECTOR', 'ELLIPSE', 'POLYGON', 'STAR']

let initState = true

let allNodes: any = []
let framesCount: number | null = null
let defaultFrames: FrameNode[] = []
let emptyFrames: FrameNode[] = []
let shapesCount: number | null = null
let defaultShapes: (RectangleNode | LineNode | VectorNode | EllipseNode | PolygonNode | StarNode)[] = []
let instancesCount: number | null = null
let defaultInstances: InstanceNode[] = []
let badNamedNodes: any = []

type UIMessage = {
  action: "SEND_COUNTERS" | "SEND_NAME"
  data: Object
  state?: boolean
}

function isUpperCase(str: string) {
  return str === str.toUpperCase();
}

function isLowerCase(str: string) {
  return str === str.toLowerCase();
}

function findIndexes(str: string, regex: RegExp) {
  var indexes: number[] = [];
  str.replace(regex, function(match, index) {
    indexes.push(index);
    return match;
  });
  return indexes;
}

function replaceCharAtIndex(str: string, index: number) {
  if (index < 0 || index >= str.length) {
    console.error("Индекс находится вне диапазона строки.");
    return str;
  }

  const part1 = str.slice(0, index);
  const part2 = str.slice(index + 1);

  const replacedChar = str.charAt(index).toUpperCase();

  return part1 + replacedChar + part2;
}

function SendToUI(msg: UIMessage) {
  figma.ui.postMessage(msg)
}

function checkName(type: any, newName: string) {
  if (type === "FRAME") {
    const re = new RegExp("Frame [0-9]+")
    return !re.test(newName)
  } 
  
  if (PRIMITIVES.includes(type)) {
    const re = new RegExp("Rectangle\s[0-9]+|Line\s[0-9]+|Arrow\s[0-9]+|Ellipse\s[0-9]+|Polygon\s[0-9]+|Star\s[0-9]+")
    return !re.test(newName)
  }

  return true
}

function getDefaultNamedLayers() {
  allNodes = figma.currentPage.findAllWithCriteria({ types: ['FRAME', 'INSTANCE', ...PRIMITIVES] })

  const frames: any = allNodes.filter((node: any) => node.type === 'FRAME')
  framesCount = frames.length

  defaultFrames = frames.filter((frame: any) => frame.name.match(/Frame [0-9]+/))
  emptyFrames = frames.filter((frame: any) => frame.children.length === 0)

  const shapes: any = allNodes.filter((node: any) => PRIMITIVES.includes(node.type))
  shapesCount = shapes.length
  defaultShapes = shapes.filter((shape: any) => shape.name.match(/Rectangle\s[0-9]+|Line\s[0-9]+|Arrow\s[0-9]+|Ellipse\s[0-9]+|Polygon\s[0-9]+|Star\s[0-9]+/))

  const instances: any = allNodes.filter((node: any) => node.type === 'INSTANCE')
  instancesCount = instances.length
  defaultInstances = instances.filter((node: any) => node.name === node?.mainComponent?.name)

  return {
    totalFrames: framesCount,
    defaultFrames: defaultFrames.length,
    emptyFrames: emptyFrames.length,
    totalShapes: shapesCount,
    defaultShapes: defaultShapes.length,
    totalInstances: instancesCount,
    defaultInstances: defaultInstances.length
  }
}

function getBadNamedLayers(convention: any) {
  const rules = [
    (node: any) => new RegExp("^[A-Z].* |_|__|-|--.*").test(node.name),
    (node: any) => new RegExp("^[a-z].* |_|__|-|--.*").test(node.name),
    (node: any) => new RegExp(" |__|-|--").test(node.name),
    (node: any) => new RegExp(" |_|-|--").test(node.name),
    (node: any) => new RegExp(" |_|__|--").test(node.name),
    (node: any) => new RegExp(" |_|__|-").test(node.name)
  ]
  badNamedNodes = allNodes.filter(rules[Number(convention)-1])
  return {
    badNamedNodes: badNamedNodes.length
  }
}

figma.ui.onmessage = msg => {
  const { action } = msg
  if (action === 'UPDATE_COUNTERS') {
    const { convention } = msg
    const defaulNamed = getDefaultNamedLayers()
    const badNamed = getBadNamedLayers(convention)

    initState = false

    SendToUI({
      action: "SEND_COUNTERS",
      data: {
        ...defaulNamed, ...badNamed
      },
      state: initState
    })
  }

  if (action === 'BACKGROUND_UPDATE_COUNTERS') {
    SendToUI({
      action: "SEND_COUNTERS",
      data: {
        totalFrames: framesCount,
        defaultFrames: defaultFrames.length,
        emptyFrames: emptyFrames.length,
        totalShapes: shapesCount,
        defaultShapes: defaultShapes.length,
        totalInstances: instancesCount,
        defaultInstances: defaultInstances.length,
        badNamedNodes: badNamedNodes.length
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
    }
    emptyFrames = []
    SendToUI({
      action: "SEND_COUNTERS",
      data: {
        totalFrames: framesCount,
        defaultFrames: defaultFrames.length,
        emptyFrames: emptyFrames.length,
        totalShapes: shapesCount,
        defaultShapes: defaultShapes.length,
        totalInstances: instancesCount,
        defaultInstances: defaultInstances.length,
        badNamedNodes: badNamedNodes.length
      }
    })
  }

  if (action === 'FIX_NAMING') {
    const { convention } = msg
    const symbols = ["", "", "_", "__", "-", "--"]
    for (const frame of badNamedNodes) {
      if (convention === "1") {
        frame.name[0].toLowerCase()
      }
      if (convention === "2") {
        frame.name[0].toUpperCase()
      }
      if (convention === "1" || convention === "2") {
        const indexes = findIndexes(frame.name, new RegExp(" |_|__|-|--"))
        let newName = frame.name
        console.log(newName, indexes)
        for (const i of indexes) {
          newName = replaceCharAtIndex(newName, i+1)
        }
        frame.name = newName
      }
      frame.name = frame.name
        .replaceAll(" ", symbols[convention-1])
        .replaceAll("_", symbols[convention-1])
        .replaceAll("__", symbols[convention-1])
        .replaceAll("-", symbols[convention-1])
        .replaceAll("--", symbols[convention-1])
    }
    badNamedNodes = []
    SendToUI({
      action: "SEND_COUNTERS",
      data: {
        totalFrames: framesCount,
        defaultFrames: defaultFrames.length,
        emptyFrames: emptyFrames.length,
        totalShapes: shapesCount,
        defaultShapes: defaultShapes.length,
        totalInstances: instancesCount,
        defaultInstances: defaultInstances.length,
        badNamedNodes: badNamedNodes.length
      }
    })
  }

  if (action === 'SELECT_ITEM') {
    const { newName } = msg

    if (newName) {
      const node = figma.currentPage.findOne((node) => node.id === defaultFrames[0].id)
      if (node && checkName(node.type, newName)) {
        node.name = msg.newName
        defaultFrames.shift()
      } else {
        figma.notify("Node is still have a default name", { error: true, timeout: 3000 })
        return
      }
    }

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