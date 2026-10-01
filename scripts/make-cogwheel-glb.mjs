/**
 * Конвертер блочной модели Minecraft (create:block/cogwheel) в GLB для <model-viewer>.
 *
 * Источник: create-1.21.1-6.0.10.jar
 *   assets/create/models/block/cogwheel.json
 *   assets/create/textures/block/{cogwheel,cogwheel_axis,axis_top}.png
 *
 * Запуск: node scripts/make-cogwheel-glb.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// GLTFExporter в Node использует FileReader для упаковки текстур — его там нет
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.onloadend = null
      this.onload = null
      this.onerror = null
      this.result = null
    }
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((ab) => {
        this.result = ab
        this.onloadend?.({ target: this })
        this.onload?.({ target: this })
      }).catch((e) => this.onerror?.(e))
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((ab) => {
        this.result = `data:${blob.type};base64,${Buffer.from(ab).toString('base64')}`
        this.onloadend?.({ target: this })
        this.onload?.({ target: this })
      }).catch((e) => this.onerror?.(e))
    }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MODEL_PATH = path.join(ROOT, 'public/models/create/cogwheel.json')
const MODEL = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'))
/** Размер (в пикселях) каждой текстуры: UV в модели считаются по её сетке. */
const TEX_SIZE = (() => {
  const out = {}
  for (const name of new Set(Object.values(MODEL.textures))) {
    if (!name.startsWith('create:block/')) continue
    const file = path.join(ROOT, 'public/models/create', name.replace('create:block/', '') + '.png')
    if (fs.existsSync(file)) {
      const buf = fs.readFileSync(file)
      // размер берём из самого PNG (IHDR: ширина/высота на байтах 16..24)
      out[name] = [buf.readUInt32BE(16), buf.readUInt32BE(20)]
    } else {
      out[name] = MODEL.texture_size ?? [16, 16]
    }
  }
  return out
})()

/**
 * Порядок граней BoxGeometry в three: +X, -X, +Y, -Y, +Z, -Z.
 * Ключи блочной модели Minecraft: east(+X), west(-X), up(+Y), down(-Y), south(+Z), north(-Z).
 */
const FACE_KEYS = ['east', 'west', 'up', 'down', 'south', 'north']

/** Кубическое освещение граней — как в Minecraft. */
const SHADE = { up: 1.0, down: 0.5, north: 0.8, south: 0.8, east: 0.6, west: 0.6 }

/**
 * Раскладывает UV прямоугольника грани на 4 вершины бокса.
 *
 * Формат Minecraft: uv = [x1, y1, x2, y2], где (x1,y1) — левый ВЕРХНИЙ угол
 * прямоугольника в текстуре, (x2,y2) — правый нижний. glTF использует ту же
 * ориентацию: (0,0) — левый верхний угол, v растёт вниз. Поэтому делим напрямую.
 *
 * Вершины бокса в порядке uv-атрибута для одной грани:
 *   0 = левый-верхний, 1 = правый-верхний, 2 = левый-нижний, 3 = правый-нижний.
 *
 * `rotation` в блочной модели поворачивает текстутуру на грани на 90°/180°/270°.
 */
function applyFaceUV(geo, faceIndex, uv, texSize, rotation = 0) {
  const [tw, th] = texSize
  const clamp = (n, m) => Math.min(Math.max(n, 0), m)
  const [x1, y1, x2, y2] = [clamp(uv[0], tw), clamp(uv[1], th), clamp(uv[2], tw), clamp(uv[3], th)]
  const uL = x1 / tw
  const uR = x2 / tw
  const vT = y1 / th
  const vB = y2 / th

  // 4 угла в порядке вершин бокса: [TL, TR, BL, BR]
  let corners = [
    [uL, vT],
    [uR, vT],
    [uL, vB],
    [uR, vB]
  ]

  // поворот грани на 90°/180°/270°
  const turn = (((rotation % 360) + 360) % 360) / 90
  for (let i = 0; i < turn; i++) {
    // corners лежит в порядке [TL, TR, BL, BR] — распаковываем в том же
    // порядке. Раньше здесь стояло [tl, tr, br, bl], из-за чего br и bl
    // менялись местами и грань после поворота брала текстуру по диагонали.
    const [tl, tr, bl, br] = corners
    // после поворота на 90° по часовой: TL<-BL, TR<-TL, BL<-BR, BR<-TR
    corners = [bl, tl, br, tr]
  }

  const attr = geo.getAttribute('uv')
  const b = faceIndex * 4
  corners.forEach(([u, v], i) => attr.setXY(b + i, u, v))
  attr.needsUpdate = true
}

/** Собирает материалы модели: по одному на пару (текстура, затенение грани). */
function collectMaterials() {
  const mats = []
  const index = new Map() // "texture|shade" -> index
  const get = (textureKey, shade) => {
    const id = `${textureKey}|${shade}`
    if (index.has(id)) return index.get(id)
    const texPath = textureKey ? MODEL.textures[textureKey] : null
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(shade, shade, shade),
      toneMapped: false
    })
    // текстуры проставляются после сборки (см. injectTextures)
    mat.name = id
    index.set(id, mats.length)
    mats.push(mat)
    void texPath
    return mats.length - 1
  }
  return { mats, get }
}

const AXIS_NAME = 'Axis'

function buildElement(el, matsApi) {
  const [fx0, fy0, fz0] = el.from
  const [tx0, ty0, tz0] = el.to
  let fx = fx0, fy = fy0, fz = fz0
  const tx = tx0, ty = ty0, tz = tz0
  // Ось в модели высокая (0..16 по Y); в игре из блока торчит только верхушка.
  // Подрезаем низ, оставляя сверху 5 единиц, и пересчитываем UV боковых граней.
  let uvShift = 0
  if (el.name === AXIS_NAME) {
    // Сколько единиц оси оставляем сверху. Низ должен упереться в верх
    // корпуса (GearCaseOuter идёт до Y=10), иначе между ними будет дыра.
    const KEEP = 6
    // Режем низ. Знак именно (ty - KEEP) - fy: при fy=0, ty=16 это 10.
    // Обратная формула (fy - (ty - KEEP)) даёт max(0, -10) = 0 — обрезка
    // не срабатывала никогда, и ось торчала во всю высоту блока.
    const cut = Math.max(0, (ty - KEEP) - fy)
    fy += cut
    uvShift = cut
  }
  const w = tx - fx
  const h = ty - fy
  const d = tz - fz

  const geo = new THREE.BoxGeometry(w, h, d)
  const perFace = [0, 0, 0, 0, 0, 0]

  FACE_KEYS.forEach((key, i) => {
    const face = el.faces?.[key]
    const shade = SHADE[key] ?? 1
    if (face?.uv) {
      // в модели ссылки на текстуры с решёткой: "#0", "#1_2", "#3"
      const texKey = String(face.texture).replace(/^#/, '')
      const modelPath = MODEL.textures[texKey]
      const size = TEX_SIZE[modelPath] ?? MODEL.texture_size ?? [16, 16]
      // сдвиг UV при обрезке оси по Y (боковые грани теряют нижнюю часть)
      let uv = face.uv
      if (uvShift > 0 && key !== 'up' && key !== 'down') {
        // Отрезали низ элемента — в текстуре тоже убираем нижние строки,
        // поэтому v2 (нижняя граница окна) уменьшается на величину среза.
        // Раньше тут стояло вычитание из v1, из-за чего окно уезжало вверх
        // и грань брала текстуру выше по атласу, чем должна.
        uv = [uv[0], uv[1], uv[2], Math.max(uv[1], uv[3] - uvShift)]
      }
      applyFaceUV(geo, i, uv, size, face.rotation ?? 0)
      perFace[i] = matsApi.get(face.texture, shade)
    } else {
      // грани без UV в модели нет — прячем её в точку, чтобы не тянуть лишний пиксель текстуры
      const attr = geo.getAttribute('uv')
      const b = i * 4
      for (let k = 0; k < 4; k++) attr.setXY(b + k, 0.5, 0.5)
      attr.needsUpdate = true
      perFace[i] = matsApi.get('__flat__', shade)
    }
    const group = geo.groups[i]
    if (group) group.materialIndex = perFace[i]
  })

  const mesh = new THREE.Mesh(geo, matsApi.mats)
  mesh.name = el.name
  mesh.position.set(fx + w / 2, fy + h / 2, fz + d / 2)

  if (el.rotation) {
    const { angle, axis, origin } = el.rotation
    const pivot = new THREE.Group()
    pivot.name = `${el.name}_pivot`
    pivot.position.set(origin[0], origin[1], origin[2])
    const inner = new THREE.Group()
    inner.add(mesh)
    pivot.add(inner)
    const rad = (angle * Math.PI) / 180
    if (axis === 'y') inner.rotation.y = rad
    else if (axis === 'x') inner.rotation.x = rad
    else inner.rotation.z = rad
    mesh.position.sub(pivot.position)
    return pivot
  }
  return mesh
}

// ---- сборка сцены ----
const matsApi = collectMaterials()
const elements = MODEL.elements.map((el) => buildElement(el, matsApi))

const spin = new THREE.Group()
spin.name = 'spin'
// Модель не наклоняем: она крутится вокруг своей оси (auto-rotate у model-viewer),
// а наклон к зрителю задаётся camera-orbit в компоненте.
elements.forEach((e) => spin.add(e))
// центрируем куб 0..16 в начало координат
elements.forEach((e) => {
  e.position.x -= 8
  e.position.y -= 8
  e.position.z -= 8
})

// Ось колеса в модели = Y (смотрит вверх), как в игре. Модель не переворачиваем:
// ракурс сверху задаст camera-orbit у <model-viewer>.
const orient = new THREE.Group()
orient.name = 'orient'
orient.add(spin)

// ---- экспорт ----
const exporter = new GLTFExporter()
const rawGlb = Buffer.from(await exporter.parseAsync(orient, { binary: true }))

/** Разбирает GLB на чанки. */
function readChunks(buf) {
  const chunks = []
  let off = 12
  while (off < buf.length) {
    const len = buf.readUInt32LE(off)
    const type = buf.readUInt32LE(off + 4)
    chunks.push({ type, data: buf.subarray(off + 8, off + 8 + len) })
    off += 8 + len
  }
  return chunks
}

function writeGlb(json, bin) {
  const pad = (b) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), 0x20)]) : b)
  const jsonPad = pad(Buffer.from(JSON.stringify(json), 'utf8'))
  const binPad = pad(bin)
  const header = Buffer.alloc(12)
  header.write('glTF', 0, 'ascii')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonPad.length + 8 + binPad.length, 8)
  const mk = (type, data) => {
    const h = Buffer.alloc(8)
    h.writeUInt32LE(data.length, 0)
    h.writeUInt32LE(type, 4)
    return Buffer.concat([h, data])
  }
  return Buffer.concat([header, mk(0x4e4f534a, jsonPad), mk(0x004e4942, binPad)])
}

const chunks = readChunks(rawGlb)
const json = JSON.parse(chunks.find((c) => c.type === 0x4e4f534a).data.toString('utf8').replace(/\0+$/, ''))
const binChunk = chunks.find((c) => c.type === 0x004e4942)
const binJsonLen = JSON.parse(chunks.find((c) => c.type === 0x4e4f534a).data.toString('utf8').replace(/\0+$/, '')).buffers?.[0]?.byteLength
// BIN-чанк выровнен пробелами: реальные данные ровно buffers[0].byteLength байт
const bin = Buffer.from(binChunk.data.subarray(0, binJsonLen ?? binChunk.data.length))

/**
 * GLTFExporter в Node не умеет упаковывать текстуры без DOM (нет canvas/image),
 * поэтому дописываем их в GLB вручную и назначаем нужным материалам.
 */
function injectTextures(jsonObj, binBuf) {
  // Buffer.copy() не увеличивает буфер, поэтому копим части в массив
  let out = Buffer.from(binBuf)
  const push = (extra) => {
    out = Buffer.concat([out, extra])
  }
  jsonObj.samplers = [{ magFilter: 9728, minFilter: 9728, wrapS: 10497, wrapT: 10497 }]
  jsonObj.images = []
  jsonObj.textures = []

  // ключ материала -> индекс текстуры
  const texIndexByKey = new Map()

  const addTexture = (textureKey) => {
    if (texIndexByKey.has(textureKey)) return texIndexByKey.get(textureKey)
    const modelPath = MODEL.textures[textureKey]
    if (!modelPath || !modelPath.startsWith('create:block/')) return null
    const file = path.join(ROOT, 'public/models/create', modelPath.replace('create:block/', '') + '.png')
    if (!fs.existsSync(file)) return null
    const png = fs.readFileSync(file)
    const offset = (out.length + 3) & ~3
    if (offset > out.length) push(Buffer.alloc(offset - out.length))
    push(png)
    jsonObj.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: png.length })
    jsonObj.images.push({ bufferView: jsonObj.bufferViews.length - 1, mimeType: 'image/png' })
    jsonObj.textures.push({ sampler: 0, source: jsonObj.images.length - 1 })
    const idx = jsonObj.textures.length - 1
    texIndexByKey.set(textureKey, idx)
    return idx
  }

  // у каждого материала three в имени зашит "textureKey|shade"
  ;(jsonObj.materials || []).forEach((mat) => {
    // имя материала: "<textureKey>|<shade>", возможен префикс "#" от экспортёра
    const textureKey = (mat.name || '').replace(/^#/, '').split('|')[0]
    const pbr = (mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {})

    if (textureKey === '__flat__') {
      // грань без UV: остаётся ровный цвет затенения
      delete pbr.baseColorTexture
      return
    }
    // shade зашит в имени после "|": множитель яркости грани
    const shade = parseFloat((mat.name || '').split('|')[1] ?? '1') || 1
    const ti = addTexture(textureKey)
    if (ti == null) return
    pbr.baseColorTexture = { index: ti }
    // затенение грани — множителем к текстуре (текстура остаётся родной)
    pbr.baseColorFactor = [shade, shade, shade, 1]
  })

  jsonObj.buffers = jsonObj.buffers || [{ byteLength: 0 }]
  jsonObj.buffers[0].byteLength = out.length
  return out
}

const finalBin = injectTextures(json, bin)
const outPath = path.join(ROOT, 'public/models/create/cogwheel.glb')
fs.writeFileSync(outPath, writeGlb(json, finalBin))
console.log('wrote', outPath, (fs.statSync(outPath).size / 1024).toFixed(1) + ' KB')
