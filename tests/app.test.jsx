import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProveedorIdioma } from '../src/i18n/idioma.jsx';
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
  await screen.findByRole('heading', { name: TEXTOS[inicial].carta.titulo });
  return resultado;
};

/**
 * Cambiar de idioma tambien baja otro trozo. Los textos de la interfaz cambian
 * al momento, pero la carta llega despues: se espera por el nombre de una
 * categoria que en ese idioma se escribe distinto que en castellano.
 */
const categoriaTraducida = (codigo) =>
  menu.categorias.find((c) => c.nombre[codigo] && c.nombre[codigo] !== c.nombre.es);

const cambiarIdioma = async (usuario, codigo) => {
  await usuario.click(screen.getByRole('button', { name: TEXTOS[codigo].idioma }));
  const cat = categoriaTraducida(codigo);
  await screen.findByRole('heading', { level: 3, name: new RegExp(`^${cat.nombre[codigo]}`, 'i') });
};

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
    // de que la franja vuelva a afirmarlo a secas.
    await montar();
    expect(negocio.premio.url).toMatch(/^https:\/\//);

    // Los dos sitios donde se afirma: la franja y el dato de "El cafe". El
    // nombre del premio es el mismo en ambos, asi que se piden a la vez.
    const enlaces = screen.getAllByRole('link', { name: new RegExp(es.premio, 'i') });
    expect(enlaces).toHaveLength(2);
    for (const enlace of enlaces) {
      expect(enlace).toHaveAttribute('href', negocio.premio.url);
    }
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

  it('ya no sale el aviso de horario pendiente', async () => {
    await montar();
    expect(screen.queryByText(es.donde.horarioPendiente)).not.toBeInTheDocument();
  });

  it('los dias se traducen al cambiar de idioma', async () => {
    // Sin esto un aleman leeria "Miércoles" en medio de su horario.
    const usuario = userEvent.setup();
    const { container } = await montar('es');

    await cambiarIdioma(usuario, 'de');
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
});

describe('mapa', () => {
  it('no carga nada de Google hasta que el visitante lo pide', async () => {
    const { container } = await montar();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toContain('google.com');
    expect(screen.getByText(es.donde.mapaAviso)).toBeInTheDocument();
  });

  it('monta el iframe al pulsar el boton', async () => {
    const usuario = userEvent.setup();
    const { container } = await montar();

    await usuario.click(screen.getByRole('button', { name: es.donde.mapaCargar }));

    const marco = container.querySelector('iframe');
    expect(marco).toBeTruthy();
    expect(marco.getAttribute('src')).toContain('google.com/maps');
  });
});

describe('carta: alergenos', () => {
  it('avisa de los alergenos siempre, haya precios o no', async () => {
    await montar();
    expect(screen.getByText(es.carta.avisoAlergenos, { exact: false })).toBeInTheDocument();
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
  // En pantalla pone "DE", pero el nombre accesible es el idioma escrito en si
  // mismo: "DE" en voz alta no le dice nada a quien busca el aleman.
  it('el selector cambia los textos de toda la pagina', async () => {
    const usuario = userEvent.setup();
    await montar('es');

    expect(screen.getByRole('heading', { name: es.carta.titulo })).toBeInTheDocument();
    await cambiarIdioma(usuario, 'de');
    expect(screen.getByRole('heading', { name: de.carta.titulo })).toBeInTheDocument();
  });

  it('marca el idioma activo', async () => {
    const usuario = userEvent.setup();
    await montar('es');

    expect(screen.getByRole('button', { name: es.idioma })).toHaveAttribute('aria-current', 'true');
    await cambiarIdioma(usuario, 'ca');
    expect(screen.getByRole('button', { name: ca.idioma })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: es.idioma })).not.toHaveAttribute('aria-current');
  });

  it('traduce tambien los nombres de las categorias de la carta', async () => {
    const usuario = userEvent.setup();
    await montar('es');

    const cat = menu.categorias.find((c) => c.nombre.de && c.nombre.de !== c.nombre.es);
    await cambiarIdioma(usuario, 'de');
    expect(screen.getByRole('heading', { name: new RegExp(cat.nombre.de, 'i') }))
      .toBeInTheDocument();
  });

  it('el titulo del documento tambien cambia de idioma', async () => {
    const usuario = userEvent.setup();
    await montar('es');

    expect(document.title).toBe(es.meta.titulo);
    await cambiarIdioma(usuario, 'de');
    expect(document.title).toBe(de.meta.titulo);
  });

  // La carta de cada idioma se baja aparte: mientras llega hay que seguir
  // viendo la de antes y no el hueco de carga.
  it('no vacia la carta mientras se baja el idioma nuevo', async () => {
    const usuario = userEvent.setup();
    const { container } = await montar('es');

    const antes = container.querySelectorAll('#carta .plato').length;
    expect(antes).toBeGreaterThan(0);

    // Justo despues de pulsar, el trozo aleman no ha llegado. Lo que no puede
    // pasar es que aparezca el hueco de carga con la carta ya leida detras.
    await usuario.click(screen.getByRole('button', { name: de.idioma }));
    expect(container.querySelector('.carta-hueco')).toBeNull();
    expect(container.querySelectorAll('#carta .plato')).toHaveLength(antes);

    const cat = categoriaTraducida('de');
    await screen.findByRole('heading', { level: 3, name: new RegExp(`^${cat.nombre.de}`, 'i') });
    expect(container.querySelectorAll('#carta .plato')).toHaveLength(antes);
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

  it('el foco entra en el mapa cuando el visitante lo carga', async () => {
    const usuario = userEvent.setup();
    const { container } = await montar();

    await usuario.click(screen.getByRole('button', { name: es.donde.mapaCargar }));
    expect(container.querySelector('iframe')).toHaveFocus();
  });

  it('la cuenta de productos no se cuela en el nombre de la categoria', async () => {
    const { container } = await montar();
    const cuenta = container.querySelector('.carta__cuenta');
    expect(cuenta).toHaveAttribute('aria-hidden', 'true');
  });
});
