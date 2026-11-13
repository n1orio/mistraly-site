import * as THREE from 'three'

type MeshData = { position: number[]; uv: number[]; index: number[] | null }
type Model = { camera: { fullWidth: number; fullHeight: number; x: number; y: number; width: number; height: number; position: number[]; target: number[]; fov: number }; parts: { name: string; meshes: MeshData[] }[] }

/** Render the original Blockbench geometry: the depth buffer, rather than CSS layers, resolves letter overlaps. */
export async function createTitleScene(canvas: HTMLCanvasElement) {
  const response = await fetch('/images/title/model.json')
  if (!response.ok) throw new Error('Title model unavailable')
  const model: Model = await response.json()
  const texture = await new THREE.TextureLoader().loadAsync('/images/title/atlas.png')
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.NoColorSpace
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  renderer.setClearColor(0, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const scene = new THREE.Scene()
  const c = model.camera
  const camera = new THREE.PerspectiveCamera(c.fov, c.fullWidth / c.fullHeight, 1, 30000)
  camera.position.fromArray(c.position)
  camera.lookAt(new THREE.Vector3().fromArray(c.target))
  camera.setViewOffset(c.fullWidth, c.fullHeight, c.x, c.y, c.width, c.height)
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .01, depthWrite: true })
  material.toneMapped = false
  const groups: THREE.Group[] = []
  const hitMeshes: THREE.Mesh[] = []
  const geometries: THREE.BufferGeometry[] = []
  for (const part of model.parts) {
    const group = new THREE.Group()
    group.name = part.name
    for (const data of part.meshes) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.position, 3))
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2))
      if (data.index) geometry.setIndex(data.index)
      geometries.push(geometry)
      group.add(new THREE.Mesh(geometry, material))
      // Hit testing stays in the resting pose, so raising a letter never makes hover flicker.
      const hit = new THREE.Mesh(geometry, material)
      hit.userData.letter = part.name
      hit.updateMatrixWorld(true)
      hitMeshes.push(hit)
    }
    groups.push(group)
    scene.add(group)
  }
  const image = texture.image as HTMLImageElement
  const atlas = document.createElement('canvas')
  atlas.width = image.width; atlas.height = image.height
  const context = atlas.getContext('2d')!
  context.drawImage(image, 0, 0)
  const alpha = context.getImageData(0, 0, atlas.width, atlas.height).data
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let selected = '', frame = 0, destroyed = false, lastTime = 0
  const render = () => renderer.render(scene, camera)
  function animate(time: number) {
    frame = 0
    if (destroyed) return
    const blend = 1 - Math.exp(-Math.min(time - (lastTime || time - 16), 64) / 75)
    lastTime = time
    let moving = false
    for (const group of groups) {
      const target = group.name === selected && group.name.length === 1 && !motion.matches ? 4 : 0
      const current = group.position.dot(up)
      const next = Math.abs(target - current) < .005 ? target : THREE.MathUtils.lerp(current, target, blend)
      group.position.copy(up).multiplyScalar(next)
      if (Math.abs(target - next) > .005) moving = true
    }
    render()
    if (moving) frame = requestAnimationFrame(animate)
  }
  function focus(name: string) {
    selected = name
    if (!frame) { lastTime = 0; frame = requestAnimationFrame(animate) }
  }
  function pointer(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect()
    mouse.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1)
    camera.updateMatrixWorld(true)
    raycaster.setFromCamera(mouse, camera)
    for (const hit of raycaster.intersectObjects(hitMeshes, false)) {
      if (!hit.uv) continue
      const x = Math.min(atlas.width - 1, Math.max(0, Math.floor(hit.uv.x * atlas.width)))
      const y = Math.min(atlas.height - 1, Math.max(0, Math.floor((1 - hit.uv.y) * atlas.height)))
      if (alpha[(y * atlas.width + x) * 4 + 3] > 3) { focus(hit.object.userData.letter); return }
    }
    focus('')
  }
  const resize = () => {
    if (destroyed) return
    const rect = canvas.getBoundingClientRect()
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false)
    render()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  return { focus, pointer, destroy() {
    destroyed = true; cancelAnimationFrame(frame); observer.disconnect()
    geometries.forEach(g => g.dispose()); material.dispose(); texture.dispose(); renderer.dispose()
  } }
}
