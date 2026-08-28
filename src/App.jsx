import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const lines = ["todos", "green line", "promoter", "hydra 10"];

const badges = [
  "/assets/catalogo-web/iconos/dermatologically-tested.webp",
  "/assets/catalogo-web/iconos/vegan.webp",
  "/assets/catalogo-web/iconos/not-tested-on-animals.webp",
];

const products = [
  {
    line: "green line",
    title: "Gel de Limpieza",
    description: "Limpieza ligera que elimina impurezas sin alterar el pH cutaneo.",
    detail: "100 ml",
    image: "/assets/catalogo-web/productos/green-line/gel-limpieza.webp",
  },
  {
    line: "green line",
    title: "Esencia de Te de Kombucha",
    description: "Locion revitalizante y antioxidante, rica en probioticos y extractos vegetales.",
    detail: "120 ml",
    image: "/assets/catalogo-web/productos/green-line/esencia-kombucha.webp",
  },
  {
    line: "green line",
    title: "Serum Super Hidratante",
    description: "Humectacion intensa con efecto de relleno para firmeza y luminosidad.",
    detail: "30 ml",
    image: "/assets/catalogo-web/productos/green-line/serum-super-hidratante.webp",
  },
  {
    line: "green line",
    title: "Serum Iluminador",
    description: "Serum antioxidante que ayuda a iluminar y proteger frente a polucion.",
    detail: "30 ml",
    image: "/assets/catalogo-web/productos/green-line/serum-iluminador.webp",
  },
  {
    line: "green line",
    title: "Serum Regenerativo",
    description: "Formula con retinol vegano para atenuar lineas finas y unificar el tono.",
    detail: "30 ml",
    image: "/assets/catalogo-web/productos/green-line/serum-retinol-vegano.webp",
  },
  {
    line: "green line",
    title: "Bakuchiol Crema Multireparadora",
    description: "Crema nutritiva de alta performance con enfoque suavizante y reafirmante.",
    detail: "48 ml",
    image: "/assets/catalogo-web/productos/green-line/bakuchiol-crema.webp",
  },
  {
    line: "promoter",
    title: "Liposomas en Spray",
    description: "Estimula el crecimiento natural de pestanas y cejas con accion antioxidante.",
    detail: "15 ml",
    image: "/assets/catalogo-web/productos/promoter/liposomas-spray.webp",
  },
  {
    line: "promoter",
    title: "Espuma Micelar",
    description: "Higiene suave para contorno de ojos, extensiones de pestanas y cejas.",
    detail: "50 ml",
    image: "/assets/catalogo-web/productos/promoter/espuma-micelar.webp",
  },
  {
    line: "hydra 10",
    title: "Hydra 10 Facial",
    description: "Crema ultra humectante con tecnologia de nano encapsulamiento aplicada.",
    detail: "50 ml",
    image: "/assets/catalogo-web/productos/hydra-10/hydra-10-facial.webp",
  },
  {
    line: "hydra 10",
    title: "Hydra 10 Corporal",
    description: "Emulsion dermoprotectora revitalizante y nutritiva para pieles secas.",
    detail: "250 ml",
    image: "/assets/catalogo-web/productos/hydra-10/hydra-10-corporal.webp",
  },
];

const revealUp = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerWrap = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardPop = {
  hidden: { opacity: 0, y: 34, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function App() {
  const [selectedLine, setSelectedLine] = useState("todos");

  const filteredProducts = useMemo(() => {
    if (selectedLine === "todos") {
      return products;
    }

    return products.filter((product) => product.line === selectedLine);
  }, [selectedLine]);

  return (
    <>
      <motion.header
        animate="visible"
        className="site-header"
        initial="hidden"
        variants={revealUp}
      >
        <div className="brand">
          <img
            alt="EXEL Professional Line"
            className="brand-logo"
            src="/assets/catalogo-web/branding/logo-exel.webp"
          />
          <div>
            <p className="brand-name">EXEL Chile</p>
            <p className="brand-tag">Dermocosmetica profesional</p>
          </div>
        </div>

        <nav className="main-nav">
          <a href="#inicio">Inicio</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#lineas">Lineas</a>
          <a href="#productos">Productos</a>
        </nav>
      </motion.header>

      <main>
        <section className="hero-section" id="inicio">
          <motion.div
            animate="visible"
            className="hero-copy"
            initial="hidden"
            variants={revealUp}
            viewport={{ once: true, amount: 0.35 }}
            whileInView="visible"
          >
            <p className="eyebrow">Catalogo transformado en experiencia web</p>
            <h1>Skincare profesional con una puesta en escena mas editorial.</h1>
            <p className="hero-text">
              Esta pagina toma el catalogo de EXEL Chile como base para presentar la marca,
              destacar sus lineas y dar protagonismo a cada producto con transiciones suaves,
              mas enfoque visual y una estructura lista para crecer.
            </p>

            <div className="hero-actions">
              <a className="button primary" href="#productos">Ver catalogo</a>
              <a className="button secondary" href="#lineas">Explorar lineas</a>
            </div>

            <div className="hero-badges">
              {badges.map((badge) => (
                <motion.span
                  className="badge-chip"
                  key={badge}
                  variants={cardPop}
                  whileHover={{ y: -6, rotate: -2 }}
                >
                  <img alt="" src={badge} />
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="hero-panel"
            initial="hidden"
            variants={revealUp}
            viewport={{ once: true, amount: 0.3 }}
            whileInView="visible"
          >
            <motion.article
              className="hero-card"
              transition={{ duration: 0.3 }}
              whileHover={{ y: -10 }}
            >
              <img
                alt="Productos EXEL"
                className="hero-image"
                src="/assets/catalogo-web/ambiente/hero-productos.webp"
              />
              <div className="hero-card-copy">
                <p className="panel-kicker">Hero principal</p>
                <h2>Una narrativa premium basada en ciencia, naturaleza e innovacion.</h2>
                <p>
                  La portada del sitio puede usar imagen, textura y sellos del catalogo
                  para que la web mantenga el mismo lenguaje de marca.
                </p>
              </div>
            </motion.article>
          </motion.div>
        </section>

        <section className="about-section" id="nosotros">
          <motion.div
            className="section-heading"
            initial="hidden"
            variants={revealUp}
            viewport={{ once: true, amount: 0.3 }}
            whileInView="visible"
          >
            <p className="eyebrow">Sobre nosotros</p>
            <h2>La pagina ya no se siente generica: se construye desde el catalogo real.</h2>
            <p>
              EXEL Chile fusiona dermocosmetica, activos naturales e innovacion para
              potenciar tanto la experiencia estetica como el crecimiento profesional.
            </p>
          </motion.div>

          <div className="about-grid">
            <motion.article
              className="about-card image-card"
              initial="hidden"
              variants={cardPop}
              viewport={{ once: true, amount: 0.25 }}
              whileInView="visible"
            >
              <img
                alt="Equipo y productos EXEL"
                className="cover-image"
                src="/assets/catalogo-web/ambiente/sobre-nosotros.webp"
              />
            </motion.article>

            <motion.article
              className="about-card content-card"
              initial="hidden"
              variants={cardPop}
              viewport={{ once: true, amount: 0.25 }}
              whileInView="visible"
            >
              <p>
                Con el respaldo de Laboratorio Biocosmetica EXEL, la web puede comunicar
                asesorias personalizadas, portafolio de alta efectividad y una propuesta
                visual mucho mas clara para captar distribuidores, profesionales o clientes finales.
              </p>

              <div className="feature-list">
                <span>Asesorias personalizadas</span>
                <span>Activos naturales</span>
                <span>Imagen de linea premium</span>
              </div>
            </motion.article>
          </div>
        </section>

        <section className="lines-section" id="lineas">
          <motion.div
            className="section-heading"
            initial="hidden"
            variants={revealUp}
            viewport={{ once: true, amount: 0.3 }}
            whileInView="visible"
          >
            <p className="eyebrow">Lineas destacadas</p>
            <h2>Tres entradas visuales para ordenar el catalogo y navegar mejor.</h2>
          </motion.div>

          <motion.div
            className="line-grid"
            initial="hidden"
            variants={staggerWrap}
            viewport={{ once: true, amount: 0.2 }}
            whileInView="visible"
          >
            <motion.article className="line-card" variants={cardPop} whileHover={{ y: -10 }}>
              <img
                alt="Green Line"
                className="cover-image"
                src="/assets/catalogo-web/ambiente/green-line.webp"
              />
              <div className="card-copy">
                <h3>Green Line</h3>
                <p>Linea vegana con activos naturales de la Pampa y la Patagonia.</p>
              </div>
            </motion.article>

            <motion.article className="line-card" variants={cardPop} whileHover={{ y: -10 }}>
              <img
                alt="Promoter"
                className="cover-image"
                src="/assets/catalogo-web/productos/promoter/liposomas-spray.webp"
              />
              <div className="card-copy">
                <h3>Promoter</h3>
                <p>Cuidado focalizado para pestanas, cejas y contorno de ojos.</p>
              </div>
            </motion.article>

            <motion.article className="line-card" variants={cardPop} whileHover={{ y: -10 }}>
              <img
                alt="Hydra 10"
                className="cover-image"
                src="/assets/catalogo-web/productos/hydra-10/hydra-10-corporal.webp"
              />
              <div className="card-copy">
                <h3>Hydra 10</h3>
                <p>Hidratacion intensiva para pieles secas con foco facial y corporal.</p>
              </div>
            </motion.article>
          </motion.div>
        </section>

        <section className="products-section" id="productos">
          <motion.div
            className="section-heading"
            initial="hidden"
            variants={revealUp}
            viewport={{ once: true, amount: 0.3 }}
            whileInView="visible"
          >
            <p className="eyebrow">Catalogo</p>
            <h2>Los productos aparecen con transiciones suaves y mejor jerarquia visual.</h2>
            <p>
              El filtro permite cambiar de linea sin romper el ritmo visual de la pagina.
            </p>
          </motion.div>

          <motion.div
            className="filter-bar"
            initial="hidden"
            variants={revealUp}
            viewport={{ once: true, amount: 0.3 }}
            whileInView="visible"
          >
            {lines.map((line) => (
              <motion.button
                key={line}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className={`filter-button ${selectedLine === line ? "active" : ""}`}
                onClick={() => setSelectedLine(line)}
                type="button"
              >
                {line}
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            animate="visible"
            className="products-grid"
            initial="hidden"
            key={selectedLine}
            variants={staggerWrap}
          >
            {filteredProducts.map((product, index) => (
              <motion.article
                className="product-card"
                key={`${product.line}-${product.title}`}
                transition={{ duration: 0.26 }}
                variants={cardPop}
                whileHover={{ y: -10 }}
              >
                <div className="product-media">
                  <img alt={product.title} className="cover-image product-image" src={product.image} />
                </div>
                <div className="product-body">
                  <span className="product-category">{product.line}</span>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div className="product-meta">
                    <strong>{product.detail}</strong>
                    <span>Ver mas</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>
      </main>
    </>
  );
}
