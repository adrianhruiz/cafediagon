import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProveedorIdioma } from '../src/i18n/idioma.jsx';
import { ruta } from '../src/rutas.js';
import App from '../src/App.jsx';
import menu from '../src/content/menu.json';
import negocio from '../src/content/business.json';
import galeria from '../src/content/gallery.json';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import de from '../src/i18n/de.json';
import ca from '../src/i18n/ca.json';

const TEXTOS = { es, en, de, ca };

/**
 * La carta va en su propio trozo y su json se baja por idioma, asi que al
 * montar no esta todavia: primero se ve el hueco de carga. Se espera a que
 * llegue, que es lo que ve cualquier visitante.
 */
const montar = async (inicial = 'es') => {
  const resultado = render(<ProveedorIdioma inicial={inicial}><App /></ProveedorIdioma>);
  // El primer montaje de cada idioma paga la transformacion de su json, que en
  // vitest se pasa del segundo por defecto de findBy.
  await screen.findByRole('heading', { name: TEXTOS[inicial].carta.titulo }, { timeout: 10000 });
  return resultado;
};

/** Una categoria que en ese idioma se escribe distinto que en castellano. */
const categoriaTraducida = (codigo) =>
  menu.categorias.find((c) => c.nombre[codigo] && c.nombre[codigo] !== c.nombre.es);

beforeEach(() => localStorage.clear());

describe('estructura de la pagina', () => {
  it('pinta todas las secciones', async () => {
    const { container } = await montar();
    for (const id of ['inicio', 'sobre', 'carta', 'juegos', 'galeria', 'donde']) {
      expect(container.querySelector(`#${id}`), `falta la seccion ${id}`).toBeTruthy();
    }
  });

  it('tiene un unico h1', async () => {
    await montar();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('tiene enlace para saltar al contenido', async () => {
    await montar();
    const salto = screen.getByRole('link', { name: es.nav.saltar });
    expect(salto).toHaveAttribute('href', '#contenido');
  });
});

describe('contacto', () => {
  it('el telefono enlaza al numero real', async () => {
    await montar();
    const enlaces = screen.getAllByRole('link', { name: negocio.telefonoVisible });
    expect(enlaces.length).toBeGreaterThan(0);
    for (const e of enlaces) expect(e).toHaveAttribute('href', `tel:${negocio.telefono}`);
  });

  it('el email enlaza con mailto', async () => {
    await montar();
    for (const e of screen.getAllByRole('link', { name: negocio.email })) {
      expect(e).toHaveAttribute('href', `mailto:${negocio.email}`);
    }
  });

  it('los tres contactos del pie son iconos con nombre accesible', async () => {
    // El dibujo no dice nada en voz alta: el nombre del enlace tiene que
    // seguir siendo el dato entero, y el svg quedarse fuera del arbol.
    const { container } = await montar();
    const iconos = container.querySelectorAll('.pie__contacto a');
    expect(iconos).toHaveLength(3);

    for (const enlace of iconos) {
      const svg = enlace.querySelector('svg');
      expect(svg, 'el contacto ya no es un icono').toBeTruthy();
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(enlace.getAttribute('aria-label')?.trim()).toBeTruthy();
    }
  });

  it('la valoracion de Google sale fechada y con su fuente', async () => {
    // Sin fecha, una media vieja se lee como actual. Con ella es un dato
    // historico y no se convierte en falso por el paso del tiempo.
    const { container } = await montar();
    const dato = container.querySelector('.sobre__datos li').textContent;

    expect(dato).toContain(String(negocio.google.resenas));
    expect(dato).toMatch(/google/i);
    // "julio de 2026" en castellano: el mes escrito, no la fecha ISO.
    const mes = new Date(negocio.google.fecha)
      .toLocaleDateString('es', { year: 'numeric', month: 'long' });
    expect(dato).toContain(mes);
  });

  it('el premio se anuncia enlazando a lo que lo acredita', async () => {
    // Directiva Omnibus: una distincion que se anuncia y no se puede comprobar
    // es publicidad enganosa. Si algun dia se queda sin URL, esto salta antes
    // de que la pagina vuelva a afirmarlo a secas.
    await montar();
    expect(negocio.premio.url).toMatch(/^https:\/\//);

    // Se afirma en un solo sitio, bajo los botones del hero: la franja verde y
    // el dato repetido en "El cafe" se quitaron para ganar alto.
    const enlaces = screen.getAllByRole('link', { name: new RegExp(es.premio, 'i') });
    expect(enlaces).toHaveLength(1);
    expect(enlaces[0]).toHaveAttribute('href', negocio.premio.url);
    expect(enlaces[0].closest('.hero'), 'el premio ya no esta en el hero').toBeTruthy();
  });

  it('no trae de vuelta ningun recurso del sello de Restaurant Guru', async () => {
    // El badge que dan para pegar carga una hoja de estilos de su CDN: eso es
    // una peticion a un tercero en cada visita, justo lo que se quito con el
    // mapa para no necesitar banner de cookies.
    const { container } = await montar();
    expect(container.innerHTML).not.toContain('infcdn.net');
    expect(container.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  it('los enlaces externos se abren con rel noreferrer', async () => {
    const { container } = await montar();
    for (const a of container.querySelectorAll('a[target="_blank"]')) {
      expect(a.getAttribute('rel'), a.getAttribute('href')).toContain('noreferrer');
    }
  });
});

describe('carta', () => {
  it('muestra todas las categorias sin filtrar', async () => {
    await montar();
    // Nivel 3: los platos son h4 y algunos repiten el nombre de su categoria
    // ("Variedad de tostadas" dentro de "Tostadas").
    for (const c of menu.categorias) {
      expect(screen.getByRole('heading', { level: 3, name: new RegExp(`^${c.nombre.es}`, 'i') }))
        .toBeInTheDocument();
    }
  });

  it('filtra al pulsar una categoria', async () => {
    const usuario = userEvent.setup();
    const { container } = await montar();

    const primera = menu.categorias[0];
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });
    await usuario.click(within(grupo).getByRole('button', { name: primera.nombre.es }));

    const titulos = [...container.querySelectorAll('.carta__categoria-titulo')];
    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toHaveTextContent(primera.nombre.es);
  });

  it('vuelve a mostrarlo todo con el boton Todo', async () => {
    const usuario = userEvent.setup();
    const { container } = await montar();
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });

    await usuario.click(within(grupo).getByRole('button', { name: menu.categorias[0].nombre.es }));
    await usuario.click(within(grupo).getByRole('button', { name: es.carta.todo }));

    expect(container.querySelectorAll('.carta__categoria-titulo'))
      .toHaveLength(menu.categorias.length);
  });

  it('marca el filtro activo con aria-pressed', async () => {
    const usuario = userEvent.setup();
    await montar();
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });
    const boton = within(grupo).getByRole('button', { name: menu.categorias[0].nombre.es });

    expect(boton).toHaveAttribute('aria-pressed', 'false');
    await usuario.click(boton);
    expect(boton).toHaveAttribute('aria-pressed', 'true');
  });

  it('avisa de que faltan los precios mientras no los haya', async () => {
    const hayPrecios = menu.categorias.some((c) => c.productos.some((p) => p.precio != null));
    await montar();
    if (hayPrecios) {
      expect(screen.queryByText(es.carta.avisoPrecios)).not.toBeInTheDocument();
    } else {
      expect(screen.getByText(es.carta.avisoPrecios)).toBeInTheDocument();
    }
  });

  it('dice que los precios llevan el IVA incluido en cuanto hay precios', async () => {
    // TRLGDCU art. 20: el precio anunciado tiene que ser el final, impuestos
    // incluidos, y el consumidor tiene que poder saberlo.
    const hayPrecios = menu.categorias.some((c) => c.productos.some((p) => p.precio != null));
    await montar();
    if (hayPrecios) {
      expect(screen.getByText(es.carta.avisoIva)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(es.carta.avisoIva)).not.toBeInTheDocument();
    }
  });
});

describe('horario', () => {
  it('pinta los siete dias con sus horas', async () => {
    const { container } = await montar();
    const filas = container.querySelectorAll('.donde__horario li');
    expect(filas).toHaveLength(negocio.horario.length);

    for (const [i, fila] of [...filas].entries()) {
      const dia = negocio.horario[i];
      expect(fila).toHaveTextContent(es.donde.dias[dia.dia]);
      if (dia.cerrado) {
        expect(fila).toHaveTextContent(es.donde.cerrado);
      } else {
        expect(fila).toHaveTextContent(dia.abre);
        expect(fila).toHaveTextContent(dia.cierra);
      }
    }
  });

  it('la seccion lleva el horario, la direccion y el mapa, y nada mas', async () => {
    // El telefono, el email y el Instagram estaban aqui y en el pie: se quedan
    // solo en el pie. La direccion hizo el viaje contrario, porque es el dato
    // que se copia para llegar y en el pie no la buscaba nadie.
    const { container } = await montar();
    const donde = container.querySelector('#donde');

    expect(donde.querySelector('.donde__horario')).toBeTruthy();
    expect(donde.querySelector('a.donde__mapa')).toBeTruthy();
    expect(donde.querySelector('a[href^="tel:"]')).toBeNull();
    expect(donde.querySelector('a[href^="mailto:"]')).toBeNull();

    const senas = donde.querySelector('address');
    expect(senas).toHaveTextContent(negocio.direccion.calle);
    expect(senas).toHaveTextContent(negocio.direccion.cp);
    expect(senas).toHaveTextContent(negocio.direccion.localidad);
    // Encima del mapa, no debajo: es lo que se lee antes de mirar el plano.
    expect(senas.compareDocumentPosition(donde.querySelector('a.donde__mapa'))
      & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('la direccion se dice una sola vez en la portada', async () => {
    // Estaba en la seccion y en el pie: la misma calle dos veces en la misma
    // pantalla. La identificacion del art. 10 LSSI la lleva el aviso legal.
    const { container } = await montar();
    expect(container.querySelectorAll('address')).toHaveLength(1);
    expect(container.querySelector('.pie address')).toBeNull();
  });

  it('ya no sale el aviso de horario pendiente', async () => {
    await montar();
    expect(screen.queryByText(es.donde.horarioPendiente)).not.toBeInTheDocument();
  });

  it('los dias salen traducidos', async () => {
    // Sin esto un aleman leeria "Miércoles" en medio de su horario.
    const { container } = await montar('de');

    const texto = container.querySelector('.donde__horario').textContent;
    expect(texto).toContain(de.donde.dias.miercoles);
    expect(texto).toContain(de.donde.cerrado);
    expect(texto).not.toContain(es.donde.dias.miercoles);
  });
});

describe('galeria', () => {
  it('cada foto lleva su descripcion en el pie de la figura', async () => {
    const { container } = await montar();
    const figuras = container.querySelectorAll('#galeria figure');
    expect(figuras).toHaveLength(galeria.length);

    for (const [i, figura] of [...figuras].entries()) {
      // El alt va vacio a proposito: el pie dice exactamente lo mismo y esta a
      // la vista, asi que con alt el lector leeria cada foto dos veces.
      expect(figura.querySelector('img').getAttribute('alt')).toBe('');
      expect(figura.querySelector('figcaption')).toHaveTextContent(galeria[i].alt.es);
    }
  });

  it('no cuelga un enlace suelto debajo de la rejilla', async () => {
    // "Ver mas en Instagram" repetia el enlace que ya esta en el pie y metia
    // una linea de alto entre la galeria y la seccion siguiente.
    const { container } = await montar();
    expect(container.querySelectorAll('#galeria a')).toHaveLength(0);
  });
});

describe('mapa', () => {
  it('se ve al entrar y no pide nada a Google', async () => {
    // El iframe de Google mandaba la IP del visitante y escribia en su
    // navegador antes de consentir nada (art. 22.2 LSSI). Ahora el mapa es una
    // imagen de esta misma web: si alguien vuelve a incrustarlo, esto salta.
    const { container } = await montar();

    expect(container.querySelector('#donde a.donde__mapa img')).toBeTruthy();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toContain('google.com/maps');
  });

  it('el mapa lleva a Google Maps y se abre fuera', async () => {
    const { container } = await montar();
    const enlace = container.querySelector('a.donde__mapa');

    expect(enlace).toHaveAttribute('href', negocio.maps);
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace.querySelector('img')).toHaveAttribute('alt', es.donde.mapaTitulo);
  });

  it('atribuye las teselas a OpenStreetMap, como pide su licencia', async () => {
    const { container } = await montar();
    const credito = container.querySelector('.donde__mapa-credito');

    expect(credito).toHaveTextContent('OpenStreetMap');
    expect(credito.querySelector('a'))
      .toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
  });

  it('el mapa no guarda nada en el navegador', async () => {
    await montar();
    expect(localStorage.getItem('diagon:mapa')).toBeNull();
  });
});

describe('carta: alergenos', () => {
  it('avisa de los alergenos siempre, haya precios o no', async () => {
    await montar();
    expect(screen.getByText(es.carta.avisoAlergenos, { exact: false })).toBeInTheDocument();
  });

  it('el aviso de alergenos va antes que el del IVA', async () => {
    // El orden en pantalla es el orden en que importan: uno puede acabar en
    // urgencias y el otro en una discusion sobre el cambio.
    const { container } = await montar();
    const avisos = [...container.querySelectorAll('#carta .carta__aviso')];

    expect(avisos).toHaveLength(2);
    expect(avisos[0]).toHaveTextContent(es.carta.avisoCocina);
    expect(avisos[1]).toHaveTextContent(es.carta.avisoIva);
  });

  it('destaca en negrita lo de la cocina compartida y lo del IVA', async () => {
    const { container } = await montar();
    const negritas = [...container.querySelectorAll('#carta .carta__aviso strong')]
      .map((n) => n.textContent);

    expect(negritas).toContain(es.carta.avisoCocina);
    expect(negritas).toContain(es.carta.avisoIva);
  });

  it('cada producto con alergenos los pinta bajo el plato', async () => {
    // Rgto (UE) 1169/2011: el dato tiene que estar en el soporte donde se
    // presenta la oferta, no solo a peticion.
    const { container } = await montar();
    const platos = container.querySelectorAll('#carta .plato');
    const conAlergenos = container.querySelectorAll('#carta .plato__alergenos');
    // La lista vacia no pinta linea: lo dice el aviso de la cabecera.
    const esperados = menu.categorias
      .flatMap((c) => c.productos)
      .filter((p) => p.alergenos == null || p.alergenos.length);

    expect(platos.length).toBe(menu.categorias.flatMap((c) => c.productos).length);
    expect(conAlergenos.length).toBe(esperados.length);
  });

  it('el aviso explica que sin linea de alergenos no lleva ninguno de los 14', async () => {
    // Si no se dice, la ausencia de linea se lee como falta de dato.
    await montar();
    expect(screen.getByText(es.carta.avisoAlergenos, { exact: false }).textContent)
      .toContain('ninguno de los 14');
  });

  it('ningun plato arrastra el viejo "Ninguno de los 14"', async () => {
    const { container } = await montar();
    expect(container.querySelector('#carta').textContent).not.toContain('Ninguno de los 14');
  });

  it('traduce los alergenos a los cuatro idiomas', async () => {
    for (const [codigo, dic] of Object.entries({ es, en, de, ca })) {
      for (const clave of Object.keys(es.carta.alergeno)) {
        expect(dic.carta.alergeno[clave], `${codigo} no traduce "${clave}"`).toBeTruthy();
      }
    }
  });

  it('la etiqueta de gluten no declara "sin gluten" a secas', async () => {
    // Rgto (UE) 828/2014: "sin gluten" exige <=20 mg/kg en el producto servido.
    for (const [codigo, dic] of Object.entries({ es, de })) {
      expect(dic.carta.sinGluten.toLowerCase(), `${codigo} declara sin gluten a secas`)
        .not.toMatch(/^(sin gluten|glutenfrei)$/);
    }
  });
});

describe('menu movil', () => {
  it('empieza cerrado y se abre al pulsar', async () => {
    const usuario = userEvent.setup();
    await montar();
    const boton = screen.getByRole('button', { name: es.nav.abrirMenu });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    await usuario.click(boton);
    expect(screen.getByRole('button', { name: es.nav.cerrarMenu }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('se cierra con Escape', async () => {
    const usuario = userEvent.setup();
    await montar();

    await usuario.click(screen.getByRole('button', { name: es.nav.abrirMenu }));
    await usuario.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: es.nav.abrirMenu }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('se cierra al pulsar un enlace de navegacion', async () => {
    const usuario = userEvent.setup();
    await montar();

    await usuario.click(screen.getByRole('button', { name: es.nav.abrirMenu }));
    await usuario.click(screen.getByRole('link', { name: es.nav.carta }));
    expect(screen.getByRole('button', { name: es.nav.abrirMenu }))
      .toHaveAttribute('aria-expanded', 'false');
  });
});

describe('idiomas', () => {
  // El selector ya no cambia un estado: cada idioma es una direccion y cada una
  // se sirve prerenderizada. Lo que hay que comprobar es que los cuatro enlaces
  // llevan donde dicen y que la pagina se pinta entera en el idioma que le toca.
  //
  // En pantalla pone "DE", pero el nombre accesible es el idioma escrito en si
  // mismo: "DE" en voz alta no le dice nada a quien busca el aleman.
  it('cada idioma es un enlace a su direccion', async () => {
    await montar('es');

    for (const codigo of ['es', 'en', 'de', 'ca']) {
      expect(screen.getByRole('link', { name: TEXTOS[codigo].idioma }), codigo)
        .toHaveAttribute('href', ruta(codigo));
    }
  });

  it('marca el idioma que se esta leyendo', async () => {
    await montar('ca');

    expect(screen.getByRole('link', { name: ca.idioma })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: es.idioma })).not.toHaveAttribute('aria-current');
  });

  it('pulsar un idioma lo guarda para la proxima visita', async () => {
    // Es lo unico que se guarda en el navegador, y solo al pulsar: asi quien
    // vuelve por una direccion sin prefijo aterriza en su idioma. Lo hace
    // src/main.jsx antes de pintar nada.
    const usuario = userEvent.setup();
    await montar('es');

    await usuario.click(screen.getByRole('link', { name: de.idioma }));
    expect(localStorage.getItem('diagon:idioma')).toBe('de');
  });

  it('la pagina se pinta entera en el idioma de su direccion', async () => {
    await montar('de');

    expect(screen.getByRole('heading', { name: de.carta.titulo })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: es.carta.titulo })).not.toBeInTheDocument();
    expect(document.title).toBe(de.meta.titulo);
  });

  it('traduce tambien los nombres de las categorias de la carta', async () => {
    await montar('de');

    const cat = categoriaTraducida('de');
    expect(screen.getByRole('heading', { level: 3, name: new RegExp(`^${cat.nombre.de}`, 'i') }))
      .toBeInTheDocument();
  });
});

describe('accesibilidad', () => {
  it('el boton del menu va antes que el menu en el DOM', async () => {
    // Si no, al abrirlo con el teclado el siguiente tabulador se salta los
    // enlaces y aterriza en los idiomas (2.4.3).
    const { container } = await montar();
    const boton = container.querySelector('.cabecera__hamburguesa');
    const menu = container.querySelector('.cabecera__nav');

    expect(boton.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(boton).toHaveAttribute('aria-controls', menu.id);
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('abrir el menu lleva el foco al primer enlace', async () => {
    const usuario = userEvent.setup();
    const { container } = await montar();

    await usuario.click(screen.getByRole('button', { name: es.nav.abrirMenu }));
    expect(container.querySelector('.cabecera__nav a')).toHaveFocus();
  });

  it('Escape cierra el menu y devuelve el foco al boton', async () => {
    const usuario = userEvent.setup();
    await montar();
    const boton = screen.getByRole('button', { name: es.nav.abrirMenu });

    await usuario.click(boton);
    await usuario.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: es.nav.abrirMenu })).toHaveFocus();
    expect(screen.getByRole('button', { name: es.nav.abrirMenu }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('anuncia por que filtro se esta viendo la carta', async () => {
    const usuario = userEvent.setup();
    await montar();
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });
    const primera = menu.categorias[0];

    expect(screen.getByRole('status')).toHaveTextContent(es.carta.todo);
    await usuario.click(within(grupo).getByRole('button', { name: primera.nombre.es }));
    expect(screen.getByRole('status')).toHaveTextContent(primera.nombre.es);
  });

  it('las fotos que aportan contenido llevan alt y las de adorno no', async () => {
    const { container } = await montar();

    expect(container.querySelector('.sobre__foto').getAttribute('alt')).toBe(es.sobre.fotoAlt);
    expect(container.querySelector('.juegos__foto').getAttribute('alt')).toBe(es.juegos.fotoAlt);
    // El fondo del hero es decoracion: el texto va escrito encima.
    expect(container.querySelector('.hero__fondo').getAttribute('alt')).toBe('');
  });

  it('el mapa es un enlace con nombre, no una imagen suelta', async () => {
    // Es lo unico que lleva a Google Maps desde la propia imagen: sin alt, el
    // enlace se anuncia por su URL y no dice a donde va (2.4.4).
    const { container } = await montar();
    const enlace = container.querySelector('a.donde__mapa');

    expect(enlace.querySelector('img').getAttribute('alt')).toBe(es.donde.mapaTitulo);
    expect(enlace.getAttribute('alt')).toBeNull();
  });

  it('la cuenta de productos no se cuela en el nombre de la categoria', async () => {
    const { container } = await montar();
    const cuenta = container.querySelector('.carta__cuenta');
    expect(cuenta).toHaveAttribute('aria-hidden', 'true');
  });
});
