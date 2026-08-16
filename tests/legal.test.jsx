import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProveedorIdioma } from '../src/i18n/idioma.jsx';
import { AVISO, PORTADA, PRIVACIDAD, ruta } from '../src/rutas.js';
import App from '../src/App.jsx';
import negocio from '../src/content/business.json';
import es from '../src/i18n/es.json';
import de from '../src/i18n/de.json';
import legalEs from '../src/content/legal.es.json';
import legalDe from '../src/content/legal.de.json';

/**
 * Cada pagina legal es ahora una direccion propia y un fichero propio, asi que
 * el componente recibe cual le toca en vez de leerla del hash. Su codigo va en
 * un trozo aparte: se espera al h1, que es lo primero que aparece cuando ha
 * llegado.
 */
const montar = (pagina = PORTADA, idioma = 'es') =>
  render(<ProveedorIdioma inicial={idioma}><App pagina={pagina} /></ProveedorIdioma>);

const abrir = async (pagina, idioma = 'es') => {
  const resultado = montar(pagina, idioma);
  const textos = idioma === 'de' ? legalDe : legalEs;
  const doc = pagina === PRIVACIDAD ? textos.privacidad : textos.aviso;
  await screen.findByRole('heading', { level: 1, name: doc.titulo });
  return resultado;
};

beforeEach(() => localStorage.clear());

describe('acceso a los textos legales', () => {
  it('el pie enlaza al aviso legal y a la privacidad', async () => {
    montar();
    // El pie no depende de la carta: esta desde el primer pintado.
    expect(await screen.findByRole('link', { name: es.pie.avisoLegal }))
      .toHaveAttribute('href', ruta('es', AVISO));
    expect(screen.getByRole('link', { name: es.pie.privacidad }))
      .toHaveAttribute('href', ruta('es', PRIVACIDAD));
  });

  it('los enlaces del pie se quedan en el idioma que se esta leyendo', async () => {
    // Desde la portada en aleman, el aviso legal que toca es el aleman, no el
    // castellano: son dos direcciones distintas y cada una es una pagina.
    montar(PORTADA, 'de');
    expect(await screen.findByRole('link', { name: de.pie.avisoLegal }))
      .toHaveAttribute('href', ruta('de', AVISO));
  });

  it('los enlaces legales siguen en el pie dentro de las propias paginas legales', async () => {
    // LSSI art. 10: acceso permanente, facil y directo, tambien desde alli.
    await abrir(AVISO);
    expect(screen.getAllByRole('link', { name: es.pie.privacidad }).length)
      .toBeGreaterThan(0);
  });

  it('la pagina legal sustituye a la portada, no se le suma', async () => {
    const { container } = await abrir(PRIVACIDAD);
    expect(container.querySelector('#carta')).toBeNull();
    expect(container.querySelector('#donde')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('la portada no pinta ninguna pagina legal', () => {
    montar(PORTADA);
    // El h1 de la portada es el del hero, que no va en ningun trozo aparte:
    // esta desde el primer pintado y no hay que esperar a nada.
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(es.hero.titulo);
    expect(screen.queryByRole('heading', { level: 1, name: legalEs.aviso.titulo }))
      .not.toBeInTheDocument();
  });

  it('el salto al contenido lleva el foco al main tambien en una pagina legal', async () => {
    // Ya no hay que hacer nada a mano: el hash dejo de ser la ruta, asi que
    // #contenido vuelve a ser el ancla que dice ser. Lo que hay que comprobar
    // es que sigue habiendo donde aterrizar.
    const usuario = userEvent.setup();
    const { container } = await abrir(AVISO);

    const salto = screen.getByRole('link', { name: es.nav.saltar });
    expect(salto).toHaveAttribute('href', '#contenido');

    await usuario.click(salto);
    expect(screen.getByRole('heading', { level: 1, name: legalEs.aviso.titulo }))
      .toBeInTheDocument();
    expect(container.querySelector('#contenido')).toBeInTheDocument();
  });
});

describe('aviso legal: identificacion del prestador (LSSI art. 10)', () => {
  it('publica el nombre del titular y su NIF', async () => {
    const { container } = await abrir(AVISO);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.titular);
    expect(texto).toContain(negocio.nif);
  });

  it('publica domicilio, telefono y correo de contacto directo', async () => {
    const { container } = await abrir(AVISO);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.direccion.calle);
    expect(texto).toContain(negocio.direccion.cp);
    expect(texto).toContain(negocio.telefonoVisible);
    expect(texto).toContain(negocio.email);
  });

  it('publica el titulo habilitante de la actividad', async () => {
    const { container } = await abrir(AVISO);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.licencia.expediente);
    expect(texto).toContain(negocio.licencia.organo);
  });

  it('no se queda en el nombre comercial', async () => {
    // "Diagon Cafe" no identifica a nadie: es lo que ya decia el pie antes.
    const { container } = await abrir(AVISO);
    expect(container.querySelector('.legal').textContent).not.toBe(negocio.nombre);
    expect(negocio.titular).not.toBe(negocio.nombre);
  });
});

describe('politica de privacidad (RGPD arts. 13-14)', () => {
  it('identifica al responsable con nombre y NIF', async () => {
    const { container } = await abrir(PRIVACIDAD);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.titular);
    expect(texto).toContain(negocio.nif);
  });

  it('declara el dato que se guarda en el navegador', async () => {
    // Exento de consentimiento (art. 22.2 LSSI), pero hay que declararlo.
    const { container } = await abrir(PRIVACIDAD);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('diagon:idioma');
    // El mapa dejo de guardar nada: si vuelve a hacerlo, hay que declararlo.
    expect(texto).not.toContain('diagon:mapa');
  });

  it('ya no describe un mapa que la web no pinta', async () => {
    // La web se quedo sin mapa: solo enlaza a Google Maps desde el pie. Una
    // politica que describa un tratamiento inexistente es tan mala como una
    // que se calle uno que existe.
    const { container } = await abrir(PRIVACIDAD);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).not.toContain('OpenStreetMap');
    // Lo que si sigue habiendo es el enlace de salida, y eso se declara.
    expect(texto).toContain('Google Maps');
  });

  it('declara la transferencia internacional del alojamiento', async () => {
    const { container } = await abrir(PRIVACIDAD);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('GitHub');
    expect(texto).toMatch(/Estados Unidos/);
  });

  it('explica los derechos y la autoridad de control', async () => {
    const { container } = await abrir(PRIVACIDAD);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('portabilidad');
    expect(texto).toContain('Agencia Española de Protección de Datos');
  });

  it('dice por que base juridica se trata cada cosa', async () => {
    const { container } = await abrir(PRIVACIDAD);
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('6.1.f');
    expect(texto).toContain('6.1.b');
    // Ya no hay ningun tratamiento que dependa del consentimiento: el mapa dejo
    // de ser un iframe de Google y no queda nada que pedir (art. 6.1.a).
    expect(texto).not.toContain('6.1.a');
  });
});

describe('paginas legales en los cuatro idiomas', () => {
  it('el aviso legal se sirve en el idioma de su direccion', async () => {
    await abrir(AVISO, 'de');
    expect(screen.getByRole('heading', { level: 1, name: legalDe.aviso.titulo }))
      .toBeInTheDocument();
  });

  it('el selector de idioma no saca de la pagina legal', async () => {
    // Desde la privacidad en castellano, DE lleva a la privacidad en aleman y
    // no a la portada, que es lo que haria un enlace fijo a la raiz.
    await abrir(PRIVACIDAD, 'es');
    expect(screen.getByRole('link', { name: de.idioma }))
      .toHaveAttribute('href', ruta('de', PRIVACIDAD));
  });

  it('cada pagina legal enlaza a la otra y a la portada de su idioma', async () => {
    const { container } = await abrir(AVISO, 'de');

    const enlaces = [...container.querySelectorAll('.legal__pie a')];
    expect(enlaces.map((a) => a.getAttribute('href')))
      .toEqual([ruta('de', PRIVACIDAD), ruta('de')]);
  });
});
