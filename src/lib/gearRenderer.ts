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
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader'
import '@babylonjs/core/Materials/PBR/pbrMaterial'
import '@babylonjs/core/Materials/standardMaterial'
// регистрирует glTF2-лоадер в SceneLoader, которым грузим cogwheel.glb
import '@babylonjs/loaders/glTF/2.0'

const MODEL_URL = '/models/create/cogwheel.glb'

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

  // Радиус камеры считается по bounding sphere, а она валидна только после
  // пересчёта мировых матриц — иначе сцена пуста и r падает в дефолт 8.
  pivot.computeWorldMatrix(true)
  applyCamera(scene, camera, opts.cameraOrbit, opts.fieldOfView)

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
