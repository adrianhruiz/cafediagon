import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProveedorIdioma } from '../src/i18n/idioma.jsx';
import App from '../src/App.jsx';
import menu from '../src/content/menu.json';
import negocio from '../src/content/business.json';
import galeria from '../src/content/gallery.json';
import es from '../src/i18n/es.json';
import de from '../src/i18n/de.json';

const montar = (inicial = 'es') =>
  render(<ProveedorIdioma inicial={inicial}><App /></ProveedorIdioma>);

beforeEach(() => localStorage.clear());

describe('estructura de la pagina', () => {
  it('pinta todas las secciones', () => {
    const { container } = montar();
    for (const id of ['inicio', 'sobre', 'carta', 'juegos', 'galeria', 'donde']) {
      expect(container.querySelector(`#${id}`), `falta la seccion ${id}`).toBeTruthy();
    }
  });

  it('tiene un unico h1', () => {
    montar();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('tiene enlace para saltar al contenido', () => {
    montar();
    const salto = screen.getByRole('link', { name: es.nav.saltar });
    expect(salto).toHaveAttribute('href', '#contenido');
  });
});

describe('contacto', () => {
  it('el telefono enlaza al numero real', () => {
    montar();
    const enlaces = screen.getAllByRole('link', { name: negocio.telefonoVisible });
    expect(enlaces.length).toBeGreaterThan(0);
    for (const e of enlaces) expect(e).toHaveAttribute('href', `tel:${negocio.telefono}`);
  });

  it('el email enlaza con mailto', () => {
    montar();
    for (const e of screen.getAllByRole('link', { name: negocio.email })) {
      expect(e).toHaveAttribute('href', `mailto:${negocio.email}`);
    }
  });

  it('los enlaces externos se abren con rel noreferrer', () => {
    const { container } = montar();
    for (const a of container.querySelectorAll('a[target="_blank"]')) {
      expect(a.getAttribute('rel'), a.getAttribute('href')).toContain('noreferrer');
    }
  });
});

describe('carta', () => {
  it('muestra todas las categorias sin filtrar', () => {
    montar();
    // Nivel 3: los platos son h4 y algunos repiten el nombre de su categoria
    // ("Variedad de tostadas" dentro de "Tostadas").
    for (const c of menu.categorias) {
      expect(screen.getByRole('heading', { level: 3, name: new RegExp(`^${c.nombre.es}`, 'i') }))
        .toBeInTheDocument();
    }
  });

  it('filtra al pulsar una categoria', async () => {
    const usuario = userEvent.setup();
    const { container } = montar();

    const primera = menu.categorias[0];
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });
    await usuario.click(within(grupo).getByRole('button', { name: primera.nombre.es }));

    const titulos = [...container.querySelectorAll('.carta__categoria-titulo')];
    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toHaveTextContent(primera.nombre.es);
  });

  it('vuelve a mostrarlo todo con el boton Todo', async () => {
    const usuario = userEvent.setup();
    const { container } = montar();
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });

    await usuario.click(within(grupo).getByRole('button', { name: menu.categorias[0].nombre.es }));
    await usuario.click(within(grupo).getByRole('button', { name: es.carta.todo }));

    expect(container.querySelectorAll('.carta__categoria-titulo'))
      .toHaveLength(menu.categorias.length);
  });

  it('marca el filtro activo con aria-pressed', async () => {
    const usuario = userEvent.setup();
    montar();
    const grupo = screen.getByRole('group', { name: es.carta.filtrarPor });
    const boton = within(grupo).getByRole('button', { name: menu.categorias[0].nombre.es });

    expect(boton).toHaveAttribute('aria-pressed', 'false');
    await usuario.click(boton);
    expect(boton).toHaveAttribute('aria-pressed', 'true');
  });

  it('avisa de que faltan los precios mientras no los haya', () => {
    const hayPrecios = menu.categorias.some((c) => c.productos.some((p) => p.precio != null));
    montar();
    if (hayPrecios) {
      expect(screen.queryByText(es.carta.avisoPrecios)).not.toBeInTheDocument();
    } else {
      expect(screen.getByText(es.carta.avisoPrecios)).toBeInTheDocument();
    }
  });
});

describe('galeria', () => {
  it('cada foto lleva texto alternativo', () => {
    const { container } = montar();
    const seccion = container.querySelector('#galeria');
    const imgs = seccion.querySelectorAll('img');
    expect(imgs).toHaveLength(galeria.length);
    for (const img of imgs) expect(img.getAttribute('alt')).toBeTruthy();
  });
});

describe('menu movil', () => {
  it('empieza cerrado y se abre al pulsar', async () => {
    const usuario = userEvent.setup();
    montar();
    const boton = screen.getByRole('button', { name: es.nav.abrirMenu });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    await usuario.click(boton);
    expect(screen.getByRole('button', { name: es.nav.cerrarMenu }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('se cierra con Escape', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole('button', { name: es.nav.abrirMenu }));
    await usuario.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: es.nav.abrirMenu }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('se cierra al pulsar un enlace de navegacion', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole('button', { name: es.nav.abrirMenu }));
    await usuario.click(screen.getByRole('link', { name: es.nav.carta }));
    expect(screen.getByRole('button', { name: es.nav.abrirMenu }))
      .toHaveAttribute('aria-expanded', 'false');
  });
});

describe('idiomas', () => {
  it('el selector cambia los textos de toda la pagina', async () => {
    const usuario = userEvent.setup();
    montar('es');

    expect(screen.getByRole('heading', { name: es.carta.titulo })).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'DE' }));
    expect(screen.getByRole('heading', { name: de.carta.titulo })).toBeInTheDocument();
  });

  it('marca el idioma activo', async () => {
    const usuario = userEvent.setup();
    montar('es');

    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-current', 'true');
    await usuario.click(screen.getByRole('button', { name: 'CA' }));
    expect(screen.getByRole('button', { name: 'CA' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'ES' })).not.toHaveAttribute('aria-current');
  });

  it('traduce tambien los nombres de las categorias de la carta', async () => {
    const usuario = userEvent.setup();
    montar('es');

    const cat = menu.categorias.find((c) => c.nombre.de && c.nombre.de !== c.nombre.es);
    await usuario.click(screen.getByRole('button', { name: 'DE' }));
    expect(screen.getByRole('heading', { name: new RegExp(cat.nombre.de, 'i') }))
      .toBeInTheDocument();
  });
});
