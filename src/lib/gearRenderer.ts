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
   * Сдвиг чёрной копии-тени вниз-вправо, в единицах модели (модель 16 юнитов
   * на весь кадр). 0 — тени нет.
   */
  shadowOffset: number
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

  /**
   * Тень: чёрная копия шестерн��, сдвинутая вниз-вправо.
   *
   * Копия нужна именно чёрной и без текстур — иначе получится вторая
   * шестерня, а не тень. Материал unlit с чёрным emissive: освещение не
   * участвует, цвет ровно (0,0,0) на всех гранях.
   *
   * Сдвиг задаём в плоскости экрана (по векторам камеры), а не в мире:
   * при постоянном мировом смещении тень уезжала бы вокруг шестерни
   * вместе с её вращением. Плюс толкаем копию чуть дальше от камеры,
   * чтобы работал обычный depth test и шестерня её перекрывала — без
   * отдельного renderingGroupId.
   */
  let shadowPivot: TransformNode | null = null
  if (opts.shadowOffset > 0) {
    const shadowMat = new StandardMaterial('gearShadow', scene)
    shadowMat.disableLighting = true
    shadowMat.emissiveColor = Color3.Black()
    shadowMat.diffuseColor = Color3.Black()
    shadowMat.specularColor = Color3.Black()
    if (opts.shadowOpacity < 1) {
      shadowMat.alpha = opts.shadowOpacity
    }

    // clone без рекурсии по детям не нужен — нам нужна полная копия.
    // Геометрия при этом шэрится с оригиналом, память не дублируется.
    const shadowSrc = src.clone('gearShadowRoot', null) as TransformNode | null
    if (shadowSrc) {
      shadowPivot = new TransformNode('gearShadow', scene)
      shadowPivot.addChild(shadowSrc)
      const shadowMeshes = shadowPivot.getChildMeshes() as Mesh[]
      for (const m of shadowMeshes) {
        m.material = shadowMat
        m.isPickable = false
        m.receiveShadows = false
      }
      /*
       * Сливаем 43 меша тени в ОДИН. Материал у них общий, поэтому
       * MergeMesches не теряет ничего, а draw call'ов становится 1
       * вместо 43. Без этого клон удваивал и так не самый лёгкий
       * по числу вызовов список мешей.
       */
      if (shadowMeshes.length > 1) {
        const merged = Mesh.MergeMeshes(shadowMeshes, true, true, undefined, false, false)
        if (merged) {
          merged.name = 'gearShadowMesh'
          merged.material = shadowMat
          merged.isPickable = false
          merged.receiveShadows = false
          merged.parent = shadowPivot
        }
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

  const camRight = new Vector3()
  const camUp = new Vector3()
  const camFwd = new Vector3()

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
      const step = (Math.PI * 2 * dt) / spinState.speed
      pivot.rotation.y += step
      if (shadowPivot) shadowPivot.rotation.y = pivot.rotation.y
    }
    if (shadowPivot) {
      /*
       * Берём оси прямо из мировой матрицы камеры, а не через
       * Vector3.Cross. Babylon — система ЛЕВАЯ, и кросс-продукт в ней
       * даёт противоположный «правый» вектор: тень уезжала влево вместо
       * вправо. В матрице локальные оси лежат так:
       *   m[0..2] = X (вправо), m[4..6] = Y (вверх), m[8..10] = Z (вперёд).
       */
      const m = camera.getWorldMatrix().m
      camRight.set(m[0], m[1], m[2])
      camUp.set(m[4], m[5], m[6])
      camFwd.set(m[8], m[9], m[10])
      const d = opts.shadowOffset
      // вправо, вниз и чуть вглубь — чтобы работал depth test
      shadowPivot.position.copyFrom(camRight).scaleInPlace(d)
      shadowPivot.position.addInPlace(camUp.scale(-d))
      shadowPivot.position.addInPlace(camFwd.scale(d * 0.35))
    }
    scene.render()
  }
  raf = requestAnimationFrame(loop)

  return {
    setCamera: (orbit, fov) => applyCamera(scene, camera, orbit, fov),
    setExposure: (v) => { scene.imageProcessingConfiguration.exposure = v },
    resize: () => engine.resize(),
    dispose: () => {
      cancelAnimationFrame(raf)
      engine.dispose()
    }
  }
}
