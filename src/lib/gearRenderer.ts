/**
 * Рендерер пиксельной 3D-шестерни на Babylon.js.
 *
 * Живёт отдельным модулем не для красоты: сам Babylon весит ~1 МБ, а шестерня
 * на главной — фоновый декор. Gear3D подключает этот файл через
 * await import(), поэтому движок уезжает в отдельный чанк и не блокирует
 * первую отрисовку страницы.
 *
 * Модель не нарисована вручную: scripts/make-cogwheel-glb.mjs конвертирует
 * блочную модель create:block/cogwheel из create-1.21.1-6.0.10.jar
 * (assets/create/models/block/cogwheel.json + текстуры block/*.png)
 * в public/models/create/cogwheel.glb с кубическим освещением граней
 * и nearest-фильтром — тем же пиксельным видом, что и в игре.
 */
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture'
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/core/Materials/PBR/pbrMaterial'
// регистрирует glTF2-лоадер в SceneLoader, которым грузим cogwheel.glb
import '@babylonjs/loaders/glTF/2.0'

const MODEL_URL = '/models/create/cogwheel.glb'

/**
 * Сколько ждём готовности шейдеров перед стартом цикла.
 *
 * Не «навсегда»: если материал так и не соберётся, мы всё равно начинаем
 * рендерить, иначе страница остаётся совсем пустой. Запас нужен на
 * компиляцию ~3 шейдеров; при нормальном GPU укладывается за десятки
 * миллисекунд, то есть статичного кадра пользователь не видит.
 */
const READY_TIMEOUT_MS = 1200

/**
 * Бит слоя, в котором лежит клон шестерни для тени.
 *
 * Рендерим мы его не в кадр, а в offscreen-текстуру, поэтому основной
 * камере этот слой видеть не надо: у камеры по умолчанию layerMask
 * 0x0FFFFFFF, а бит 0x20000000 в него не входит, и клон отсекается сам.
 * Так в кадре остаётся 43 меша шестерни плюс один квад, а не 86.
 */
const SHADOW_LAYER = 0x20000000

/**
 * Прогрев движка и модели начинается до монтирования компонента.
 *
 * Шестерня — фоновый декор, но её не видно первые пару секунд после
 * перезагрузки: браузер сначала качает мегабайтный чанк Babylon, потом
 * парсит GLB, потом компилирует шейдеры. Если всё это стартует из
 * onMounted, страница успевает отрисоваться без шестерни, и та появляется
 * заметно позже. Поэтому импорт и запрос модели поднимаем заранее — из
 * main.ts навигация уже идёт параллельно.
 *
 * Промис один на всё приложение: повторные import() того же модуля
 * возвращают тот же результат, второй запрос модели не пойдёт.
 */
let preloadPromise: Promise<unknown> | null = null

export function preloadGear(): Promise<unknown> {
  if (!preloadPromise) {
    preloadPromise = (async () => {
      const mod = await import('./gearRenderer')
      // Модель тянем отдельным запросом и держим в кэше браузера:
      // LoadAssetContainerAsync переиспользует его из HTTP-кэша.
      await fetch(MODEL_URL, { cache: 'force-cache' }).catch(() => undefined)
      return mod
    })()
  }
  return preloadPromise
}

/**
 * Опции вращения живут по ссылке: рендер-цикл читает их каждый кадр, поэтому
 * смена speed/spin на стороне Vue подхватывается без пересоздания движка.
 */
export interface GearSpin {
  /** секунд на оборот */
  speed: number
  /** вращать ли */
  spin: boolean
}

export interface GearRendererOptions {
  /** экспозиция рендера */
  exposure: number
  /** ракурс камеры как у model-viewer: «<азимут>deg <высота>deg <радиус>%» */
  cameraOrbit: string
  /** поле зрения камеры, градусы */
  fieldOfView: string
  /**
   * Сдвиг плоской 2D-тени вниз-вправо, в CSS-пикселях. 0 — тени нет.
   * Переводится в единицы сцены по высоте квада, поэтому не зависит от
   * размера канваса и от DPR.
   */
  shadowOffset: number
  /**
   * Насколько силуэт тени крупнее самой шестерни. 1 — ровно по контуру,
   * 1.04 — тень обрамляет зубья. Масштаб от центра модели.
   */
  shadowScale: number
  /** непрозрачность тени, 1 — сплошной чёрный */
  shadowOpacity: number
}

export interface GearRenderer {
  setCamera(orbit: string, fov: string): void
  setExposure(v: number): void
  resize(): void
  dispose(): void
}

/** Разбирает «225deg 160deg 140%» в углы glTF-орбиты. */
function parseOrbit(orbit: string) {
  const [thetaRaw = '225', phiRaw = '160', radiusRaw = '100'] = orbit.split(/\s+/)
  const num = (s: string) => parseFloat(s) || 0
  return { theta: num(thetaRaw), phi: num(phiRaw), radius: num(radiusRaw) / 100 }
}

/**
 * Ракурс Orbit-камеры Babylon и glTF-орбита model-viewer считаются по-разному,
 * поэтому пересчитываем сферические координаты явно, а не подбираем смещения:
 * glTF-phi отсчитывается от +Y вниз, alpha в Babylon — азимут от +Z.
 */
function applyCamera(scene: Scene, cam: ArcRotateCamera, orbit: string, fov: string) {
  const { theta, phi, radius } = parseOrbit(orbit)
  const t = (theta * Math.PI) / 180
  const p = (phi * Math.PI) / 180
  const dir = new Vector3(
    Math.sin(p) * Math.sin(t),
    Math.cos(p),
    Math.sin(p) * Math.cos(t)
  )
  const fovRad = ((parseFloat(fov) || 26) * Math.PI) / 180
  cam.fov = fovRad

  // 140% от model-viewer = камера заметно дальше «вписания» модели, чтобы
  // шестерня выходила за края бокса. Вписываем по сфере с центром в нуле:
  // дистанция = r / sin(fov/2).
  const r = scene.meshes.reduce(
    (max, m) => Math.max(max, m.getBoundingInfo().boundingSphere.radiusWorld),
    8
  )
  cam.radius = (r / Math.sin(fovRad / 2)) * 0.72 * radius
  cam.lowerRadiusLimit = cam.radius
  cam.upperRadiusLimit = cam.radius
  cam.setTarget(Vector3.Zero())
  cam.setPosition(dir.normalize().scale(cam.radius))
}

export async function createGearRenderer(
  canvas: HTMLCanvasElement,
  opts: GearRendererOptions,
  /** передаётся по ссылке: caller мутирует поле, цикл подхватывает на лету */
  spinState: GearSpin
): Promise<GearRenderer> {
  const engine = new Engine(canvas, true, {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: false,
    stencil: false,
    powerPreference: 'low-power'
  })
  // Рендерим в физических пикселях, но не выше 2x: на телефоне 3x даёт
  // лишний вес буфера без видимого выигрыша в пиксель-арте.
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 2))

  const scene = new Scene(engine)
  scene.clearColor = new Color4(0, 0, 0, 0)
  scene.imageProcessingConfiguration.exposure = opts.exposure
  // Пиксельный вид: без тонмаппинга, иначе грани Create «уезжают» в небо.
  scene.imageProcessingConfiguration.toneMappingEnabled = false

  const camera = new ArcRotateCamera('cam', 0, 0, 10, Vector3.Zero(), scene)
  camera.lowerBetaLimit = 0
  camera.upperBetaLimit = Math.PI

  const container = await LoadAssetContainerAsync(MODEL_URL, scene)
  const src = container.transformNodes[0]
  if (!src) {
    engine.dispose()
    throw new Error('cogwheel.glb: в контейнере нет корневого узла')
  }
  // Текстуры в GLB уже помечены NEAREST, но часть лоадеров берёт дефолт сцены —
  // фиксируем явно, иначе на HiDPI появится билинейная каша вместо пикселей.
  for (const mat of container.materials) {
    for (const tex of mat.getActiveTextures()) {
      if (tex instanceof Texture) tex.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
    }
  }

  // Контейнер держит узлы ВНЕ сцены: одного addChild() мало, scene.meshes
  // остаётся пустым и кадр рисуется пустым. addAllToScene() — единственный
  // способ их зарегистрировать, дальше цепочку оборачиваем в свой узел.
  container.addAllToScene()
  const pivot = new TransformNode('gear', scene)
  pivot.addChild(src)
  pivot.getChildMeshes().forEach((m) => { m.isPickable = false; m.receiveShadows = false })

  // Радиус камеры считаем ДО добавления тени: bounding sphere по всей сцене
  // раздулся бы на сдвинутую копию и шестерня стала бы мельче.
  pivot.computeWorldMatrix(true)
  applyCamera(scene, camera, opts.cameraOrbit, opts.fieldOfView)

  /*
   * Тень — плоский 2D-силуэт ПОЗАДИ шестерни.
   *
   * Как это собрано:
   *  1) копия модели (клон) красится в сплошной чёрный unlit и рендерится
   *     в offscreen-текстуру (RTT) камерой, повторяющей основную. В RTT
   *     попадает ровно тот силуэт, который видит зритель;
   *  2) эта текстура натягивается на ПЛОСКИЙ квад, который является
   *     ребёнком камеры, то есть живёт в координатах экрана. Сдвиг квада
   *     по X/Y — это и есть сдвиг тени, ровно в пикселях.
   *
   * Почему не «просто сдвинутый 3D-клон»: клон — объёмный, и его силуэт
   * меняется от ракурса, а тень должна быть плоской наклейкой. Плюс
   * объёмный клон в основной сцене ещё и перекрывался шестернёй по
   * глубине неравномерно.
   *
   * Про чёткость: RTT создаётся в размер буфера канваса и с NEAREST,
   * поэтому край тени остаётся пиксельным, без размытия. Половинного
   * разрешения здесь быть не должно.
   *
   * Клон остаётся (он и даёт силуэт), но в основной рендер больше не
   * попадает: ему выставлен слой SHADOW_LAYER, которого нет у камеры.
   * Так в кадре остаётся 43 меша шестерни + 1 квад, а не 86.
   */
  let shadow: {
    rtt: RenderTargetTexture
    quad: Mesh
    cam: ArcRotateCamera
    /** узел клона: его крутим и масштабируем вместе с шестернёй */
    pivot: TransformNode
  } | null = null

  if (opts.shadowOffset > 0) {
    const shadowMat = new StandardMaterial('gearShadow', scene)
    shadowMat.disableLighting = true
    shadowMat.emissiveColor = Color3.Black()
    shadowMat.diffuseColor = Color3.Black()
    shadowMat.specularColor = Color3.Black()

    // Клон: геометрия шэрится с оригиналом, память не дублируется.
    const shadowSrc = src.clone('gearShadowRoot', null) as TransformNode | null
    if (shadowSrc) {
      const shadowPivot = new TransformNode('gearShadow', scene)
      shadowPivot.addChild(shadowSrc)
      shadowPivot.scaling.setAll(opts.shadowScale)
      const shadowMeshes = shadowPivot.getChildMeshes() as Mesh[]
      for (const m of shadowMeshes) {
        m.material = shadowMat
        m.isPickable = false
        m.receiveShadows = false
        m.layerMask = SHADOW_LAYER
      }
      // 43 меша в один: в RTT это один draw call вместо сорока трёх.
      let silhouette: Mesh | null = shadowMeshes[0] ?? null
      if (shadowMeshes.length > 1) {
        const merged = Mesh.MergeMeshes(shadowMeshes, true, true, undefined, false, false)
        if (merged) {
          merged.name = 'gearShadowMesh'
          merged.material = shadowMat
          merged.isPickable = false
          merged.layerMask = SHADOW_LAYER
          merged.parent = shadowPivot
          silhouette = merged
        }
      }
      if (silhouette) {
        // Камера для RTT: та же ориентация, что у основной, но видит
        // ТОЛЬКО слой тени. У основной камеры в layerMask этого бита
        // нет, поэтому клон в кадр не попадает.
        const shadowCam = new ArcRotateCamera('shadowCam', 0, 0, 10, Vector3.Zero(), scene)
        shadowCam.layerMask = SHADOW_LAYER
        shadowCam.minZ = camera.minZ
        shadowCam.maxZ = camera.maxZ

        const rtt = new RenderTargetTexture(
          'gearShadowRTT',
          { width: 1, height: 1 },
          scene,
          { generateMipMaps: false, samplingMode: Texture.NEAREST_SAMPLINGMODE }
        )
        rtt.clearColor = new Color4(0, 0, 0, 0)
        rtt.renderList = [silhouette]
        rtt.activeCamera = shadowCam

        // Плоский квад-подложка. Он ребёнок камеры, поэтому его локальные
        // X/Y — это буквально пиксели экрана.
        const quad = MeshBuilder.CreatePlane('gearShadowQuad', { size: 1 }, scene)
        const quadMat = new StandardMaterial('gearShadowQuadMat', scene)
        quadMat.disableLighting = true
        // Цвет задаём чёрным САМИМ материалом, а не картинкой в RTT.
        // Наблюдалось: emissiveTexture у квада не биндился, Babylon
        // подставлял белый, и тень выходила светло-серой вместо чёрной
        // (255 * прозрачность 0.55 * маска ≈ 102 — ровно то, что было).
        // С чёрным emissive результат одинаково чёрный, даже если
        // текстура не отдаст цвет. Форму даёт opacityTexture.
        quadMat.emissiveColor = Color3.Black()
        quadMat.diffuseColor = Color3.Black()
        quadMat.ambientColor = Color3.Black()
        quadMat.specularColor = Color3.Black()
        quadMat.emissiveTexture = rtt
        quadMat.opacityTexture = rtt
        quadMat.backFaceCulling = false
        if (opts.shadowOpacity < 1) quadMat.alpha = opts.shadowOpacity
        quad.material = quadMat
        quad.parent = camera
        quad.isPickable = false
        quad.alwaysSelectAsActiveMesh = true
        quad.renderingGroupId = 0
        // Шестерня — в группу 1. Babylon чистит глубину между группами,
        // поэтому квад гарантированно окажется под ней.
        pivot.getChildMeshes().forEach((m) => { m.renderingGroupId = 1 })

        shadow = { rtt, quad, cam: shadowCam, pivot: shadowPivot }
        layoutShadow()
      }
    }
  }

  /*
   * Ждём готовности текстур и компиляции шейдеров, но НЕ НАВСЕГДА.
   *
   * Раньше здесь стоял голый await whenReadyAsync(), и это было миной:
   * если хоть один материал не доходит до готовности (шейдер не
   * собрался на конкретном GPU, текстура не декодировалась), промис
   * не резолвится — цикл рендера не стартует — и на странице не
   * отрисовывается вообще ничего. Отсюда было «модели нет».
   *
   * Поэтому гоняем с таймаутом: успели — стартуем без статичного кадра,
   * не успели — стартуем всё равно, Babylon сам дорисует готовые меши.
   */
  await Promise.race([
    scene.whenReadyAsync(),
    new Promise((resolve) => setTimeout(resolve, READY_TIMEOUT_MS))
  ])

  /*
   * Материалы здесь намеренно НЕ заморачиваем (material.freeze() и
   * scene.blockMaterialDirtyMechanism). Выигрыш копеечный — материалов
   * всего 9, — а риск тот же, что и выше: если текстура придёт позже,
   * замороженный материал навсегда останется неготовым и на экране снова
   * не будет ничего.
   */

  /**
   * Раскладывает квад тени по экрану: размер под фрустум и сдвиг в пикселях.
   *
   * RTT отрендерен основной камерой, поэтому картинка в нём — ровно то,
   * что видит зритель. Чтобы натянуть её 1:1, квад должен быть ровно по
   * размеру фрустума на своём расстоянии, а его UV 0..1 — на весь RTT.
   */
  function layoutShadow() {
    if (!shadow) return
    const { rtt, quad, cam: shadowCam } = shadow
    // RTT по размеру буфера канваса: иначе тень мылится.
    const bw = engine.getRenderWidth()
    const bh = engine.getRenderHeight()
    if (rtt.getSize().width !== bw || rtt.getSize().height !== bh) {
      rtt.resize({ width: bw, height: bh })
    }
    // Камера RTT повторяет основную (та же самая картинка силуэта).
    shadowCam.alpha = camera.alpha
    shadowCam.beta = camera.beta
    shadowCam.radius = camera.radius
    shadowCam.fov = camera.fov
    shadowCam.setTarget(Vector3.Zero())

    // Квад — ребёнок камеры, поэтому Z отсчитывается вперёд по её оси.
    const d = camera.radius * 2
    const h = 2 * d * Math.tan(camera.fov / 2)
    const aspect = engine.getAspectRatio(camera)
    quad.scaling.set(h * aspect, h, 1)
    quad.position.set(0, 0, d)
    // Сдвиг в пикселях CSS -> в единицы сцены.
    const cssH = canvas.clientHeight || engine.getRenderHeight()
    const perPx = h / cssH
    quad.position.x += opts.shadowOffset * perPx
    quad.position.y -= opts.shadowOffset * perPx
  }

  let raf = 0
  let last = performance.now()
  const loop = () => {
    raf = requestAnimationFrame(loop)
    const now = performance.now()
    // Кламп dt: после сворачивания вкладки первый кадр иначе дёргает
    // шестерню на пол-оборота.
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    if (spinState.spin && spinState.speed > 0) {
      pivot.rotation.y += (Math.PI * 2 * dt) / spinState.speed
    }
    if (shadow) {
      /*
       * Клон обязан крутиться ВМЕСТЕ с шестернёй, иначе силуэт в RTT
       * останется замороженным, пока зубья едут мимо. Раньше здесь была
       * отдельная строка, и я потерял её при переписывании цикла на
       * offscreen-тень — тень стояла на месте.
       *
       * Заодно силуэт чуть крупнее самой шестерни (shadowScale): тень
       * должна обрамлять её, а не совпадать по контуру.
       */
      shadow.pivot.rotation.y = pivot.rotation.y
      shadow.rtt.render()
    }
    scene.render()
  }
  raf = requestAnimationFrame(loop)

  return {
    setCamera: (orbit, fov) => {
      applyCamera(scene, camera, orbit, fov)
      layoutShadow()
    },
    setExposure: (v) => { scene.imageProcessingConfiguration.exposure = v },
    resize: () => {
      engine.resize()
      layoutShadow()
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      engine.dispose()
    }
  }
}
