const root = document.documentElement;
const shiftButton = document.getElementById("themeShift");
const reveals = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll(".counter");
const sortAccuracy = document.getElementById("sortAccuracy");

const householdInput = document.getElementById("household");
const recycleInput = document.getElementById("recycle");
const householdVal = document.getElementById("householdVal");
const recycleVal = document.getElementById("recycleVal");
const reductionKg = document.getElementById("reductionKg");
const reductionBar = document.getElementById("reductionBar");
const contactForm = document.getElementById("contactForm");
const formMsg = document.getElementById("formMsg");

shiftButton.addEventListener("click", () => {
  root.classList.toggle("shifted");
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((item, index) => {
  item.style.transitionDelay = `${index * 70}ms`;
  revealObserver.observe(item);
});

const runCounters = () => {
  counters.forEach((counter) => {
    const target = Number(counter.dataset.target);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 120));

    const update = () => {
      current += step;
      if (current >= target) {
        counter.textContent = target.toLocaleString();
        return;
      }
      counter.textContent = current.toLocaleString();
      requestAnimationFrame(update);
    };

    update();
  });
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounters();
        counterObserver.disconnect();
      }
    });
  },
  { threshold: 0.4 }
);

const impactSection = document.getElementById("impact");
counterObserver.observe(impactSection);

const calculateReduction = () => {
  const household = Number(householdInput.value);
  const recycle = Number(recycleInput.value);

  householdVal.textContent = household;
  recycleVal.textContent = recycle;

  // Basic estimate: larger homes with higher recycle rates divert more landfill.
  const baselinePerPerson = 28;
  const monthlyWaste = household * baselinePerPerson;
  const reduction = Math.round(monthlyWaste * (recycle / 100) * 0.8);

  reductionKg.textContent = reduction.toLocaleString();
  const width = Math.min(100, Math.round((reduction / 220) * 100));
  reductionBar.style.width = `${width}%`;
};

householdInput.addEventListener("input", calculateReduction);
recycleInput.addEventListener("input", calculateReduction);
calculateReduction();

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMsg.textContent = "Request submitted. Team EcoPulse will contact you shortly.";
  formMsg.style.color = "var(--accent-2)";
  contactForm.reset();
  calculateReduction();
});

// 3D scene setup with Three.js for an animated waste ecosystem visualization.
(function setupThreeScene() {
  const canvas = document.getElementById("waste3d");
  if (!canvas || typeof THREE === "undefined") {
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 2.5, 8);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const directional = new THREE.DirectionalLight(0xffffff, 0.9);
  directional.position.set(3, 7, 4);
  scene.add(ambient, directional);

  const floorGeometry = new THREE.CircleGeometry(4.2, 40);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xbde7d9, metalness: 0.1, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.5;
  scene.add(floor);

  const group = new THREE.Group();

  const binColors = [0x3f9777, 0xf29f05, 0x4c77b9];
  binColors.forEach((color, index) => {
    const bin = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.5, 1.1),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 })
    );
    bin.position.x = (index - 1) * 1.55;
    bin.position.y = -0.55;

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.17, 1.22),
      new THREE.MeshStandardMaterial({ color: 0x1f2f2b, roughness: 0.4 })
    );
    lid.position.y = 0.86;
    bin.add(lid);

    group.add(bin);
  });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.18, 20, 100),
    new THREE.MeshStandardMaterial({ color: 0xf28f16, roughness: 0.4, metalness: 0.5 })
  );
  ring.rotation.x = Math.PI / 2.1;
  ring.position.y = 0.4;
  group.add(ring);

  const orbitDots = [];
  const dotGeometry = new THREE.SphereGeometry(0.08, 12, 12);
  for (let i = 0; i < 26; i += 1) {
    const dot = new THREE.Mesh(
      dotGeometry,
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0x47b88f : 0xffbe4a })
    );
    scene.add(dot);
    orbitDots.push(dot);
  }

  scene.add(group);

  const resizeRenderer = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) {
      return;
    }
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  let t = 0;
  const animate = () => {
    t += 0.013;
    group.rotation.y += 0.006;
    ring.rotation.z += 0.01;

    orbitDots.forEach((dot, i) => {
      const angle = t + i * 0.24;
      const radius = 2.7 + ((i % 4) * 0.12);
      dot.position.x = Math.cos(angle) * radius;
      dot.position.z = Math.sin(angle) * radius;
      dot.position.y = Math.sin(angle * 2.1) * 0.55;
    });

    sortAccuracy.textContent = `${95 + Math.floor((Math.sin(t * 2) + 1) * 1.5)}`;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  resizeRenderer();
  window.addEventListener("resize", resizeRenderer);
  animate();
})();
