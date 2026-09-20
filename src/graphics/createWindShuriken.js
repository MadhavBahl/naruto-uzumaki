import { AdditiveBlending, DoubleSide, Group, Mesh, MeshBasicMaterial, ShaderMaterial, Shape, ShapeGeometry, TorusGeometry } from 'three'

/** Shared curved-blade geometry; the parent scene owns disposal of every resource. */
export function createWindShuriken(uniforms) {
  const group = new Group()
  group.visible = false
  group.position.z = -0.06
  const rotor = new Group()
  group.add(rotor)

  const shape = new Shape()
  shape.moveTo(0.28, -0.12)
  shape.quadraticCurveTo(0.8, -0.43, 1.48, 0.05)
  shape.quadraticCurveTo(1.01, 0.13, 0.62, 0.29)
  shape.quadraticCurveTo(0.43, 0.27, 0.28, 0.12)
  shape.closePath()
  const geometry = new ShapeGeometry(shape, 20)
  const strength = { value: 0 }
  const material = new ShaderMaterial({
    uniforms: { ...uniforms, uStrength: strength },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vBlade;
      void main() {
        vBlade = position.xy;
        vec3 p = position;
        p.z += sin(p.x * 8.0 - uTime * 2.0) * 0.018;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uCharge;
      uniform float uStrength;
      uniform vec3 uColor;
      varying vec2 vBlade;
      void main() {
        float span = clamp((vBlade.x - 0.28) / 1.2, 0.0, 1.0);
        float flow = vBlade.y * 72.0 + sin(vBlade.x * 5.0 - uTime * 1.4) * 2.0;
        float filament = pow(abs(sin(flow - uTime * 3.0)), 12.0);
        float light = 0.55 + filament * 0.3 + uCharge * 0.1;
        vec3 color = mix(uColor, vec3(0.9, 0.99, 1.0), 0.55 + filament * 0.3);
        float alpha = uStrength * light * (1.0 - span * 0.35);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true, side: DoubleSide, blending: AdditiveBlending, depthWrite: false,
  })

  for (let index = 0; index < 4; index++) {
    const blade = new Mesh(geometry, material)
    blade.rotation.z = index * Math.PI / 2
    // Slight pitch gives the wind blades depth when the viewer orbits the scene.
    blade.rotation.x = 0.1
    rotor.add(blade)
  }

  const trails = new Group()
  group.add(trails)
  const trailGeometry = new TorusGeometry(1.4, 0.004, 4, 48, Math.PI * 0.32)
  const trailMaterial = new MeshBasicMaterial({
    color: uniforms.uColor.value, transparent: true, opacity: 0,
    blending: AdditiveBlending, depthWrite: false,
  })
  for (let index = 0; index < 4; index++) {
    const trail = new Mesh(trailGeometry, trailMaterial)
    trail.rotation.z = index * Math.PI / 2 + 0.16
    trails.add(trail)
  }

  const releaseMaterial = new MeshBasicMaterial({
    color: uniforms.uColor.value, transparent: true, opacity: 0,
    blending: AdditiveBlending, depthWrite: false,
  })
  const release = new Mesh(new TorusGeometry(1.22, 0.012, 6, 128), releaseMaterial)
  group.add(release)

  return {
    group,
    update(delta, amount, charge, burst) {
      strength.value = amount
      group.visible = amount > 0.01
      if (!group.visible) return
      // Integrate rotation instead of multiplying time by speed, avoiding charge-state jumps.
      rotor.rotation.z += delta * (1.15 + charge * 1.2 + burst * 0.4)
      rotor.scale.setScalar(0.94 + charge * 0.08 + burst * 0.08)
      trails.rotation.z = -rotor.rotation.z * 0.45
      trailMaterial.color.copy(uniforms.uColor.value)
      trailMaterial.opacity = amount * (0.16 + charge * 0.14)
      release.scale.setScalar(1 + burst * 0.55)
      releaseMaterial.color.copy(uniforms.uColor.value)
      releaseMaterial.opacity = amount * burst * 0.32
    },
  }
}