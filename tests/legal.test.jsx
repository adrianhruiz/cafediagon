import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProveedorIdioma } from '../src/i18n/idioma.jsx';
import App from '../src/App.jsx';
import negocio from '../src/content/business.json';
import es from '../src/i18n/es.json';
import de from '../src/i18n/de.json';
import legalEs from '../src/content/legal.es.json';
import legalDe from '../src/content/legal.de.json';

/**
 * Las dos paginas legales viven en el hash y su componente va en un trozo
 * aparte: se monta con el hash puesto y se espera al h1, que es lo primero que
 * aparece cuando el trozo ha llegado.
 */
const montar = (hash = '', idioma = 'es') => {
  window.location.hash = hash;
  return render(<ProveedorIdioma inicial={idioma}><App /></ProveedorIdioma>);
};

const abrir = async (hash, idioma = 'es') => {
  const resultado = montar(hash, idioma);
  const textos = idioma === 'de' ? legalDe : legalEs;
  const doc = hash === '#privacidad' ? textos.privacidad : textos.aviso;
  await screen.findByRole('heading', { level: 1, name: doc.titulo });
  return resultado;
};

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

describe('acceso a los textos legales', () => {
  it('el pie enlaza al aviso legal y a la privacidad', async () => {
    montar();
    // El pie no depende de la carta: esta desde el primer pintado.
    expect(await screen.findByRole('link', { name: es.pie.avisoLegal }))
      .toHaveAttribute('href', '#aviso-legal');
    expect(screen.getByRole('link', { name: es.pie.privacidad }))
      .toHaveAttribute('href', '#privacidad');
  });

  it('el enlace del pie abre el aviso legal sin recargar', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(await screen.findByRole('link', { name: es.pie.avisoLegal }));

    expect(await screen.findByRole('heading', { level: 1, name: legalEs.aviso.titulo }))
      .toBeInTheDocument();
  });

  it('los enlaces legales siguen en el pie dentro de las propias paginas legales', async () => {
    // LSSI art. 10: acceso permanente, facil y directo, tambien desde alli.
    await abrir('#aviso-legal');
    expect(screen.getAllByRole('link', { name: es.pie.privacidad }).length)
      .toBeGreaterThan(0);
  });

  it('la pagina legal sustituye a la portada, no se le suma', async () => {
    const { container } = await abrir('#privacidad');
    expect(container.querySelector('#carta')).toBeNull();
    expect(container.querySelector('#donde')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('un hash que no es legal sigue siendo un ancla de la portada', async () => {
    montar('#donde');
    await screen.findByRole('heading', { name: es.carta.titulo });
    expect(screen.queryByRole('heading', { level: 1, name: legalEs.aviso.titulo }))
      .not.toBeInTheDocument();
  });

  it('el salto al contenido no echa de la pagina legal', async () => {
    // El hash es la ruta: si #contenido llegase a la barra de direcciones,
    // saltarse la cabecera devolveria a la portada.
    const usuario = userEvent.setup();
    const { container } = await abrir('#aviso-legal');

    await usuario.click(screen.getByRole('link', { name: es.nav.saltar }));

    expect(screen.getByRole('heading', { level: 1, name: legalEs.aviso.titulo }))
      .toBeInTheDocument();
    expect(container.querySelector('#contenido')).toHaveFocus();
    expect(window.location.hash).toBe('#aviso-legal');
  });

  it('el foco entra en el contenido al abrir una pagina legal', async () => {
    const usuario = userEvent.setup();
    const { container } = montar();

    await usuario.click(await screen.findByRole('link', { name: es.pie.privacidad }));
    await screen.findByRole('heading', { level: 1, name: legalEs.privacidad.titulo });

    expect(container.querySelector('#contenido')).toHaveFocus();
  });
});

describe('aviso legal: identificacion del prestador (LSSI art. 10)', () => {
  it('publica el nombre del titular y su NIF', async () => {
    const { container } = await abrir('#aviso-legal');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.titular);
    expect(texto).toContain(negocio.nif);
  });

  it('publica domicilio, telefono y correo de contacto directo', async () => {
    const { container } = await abrir('#aviso-legal');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.direccion.calle);
    expect(texto).toContain(negocio.direccion.cp);
    expect(texto).toContain(negocio.telefonoVisible);
    expect(texto).toContain(negocio.email);
  });

  it('publica el titulo habilitante de la actividad', async () => {
    const { container } = await abrir('#aviso-legal');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.licencia.expediente);
    expect(texto).toContain(negocio.licencia.organo);
  });

  it('no se queda en el nombre comercial', async () => {
    // "Diagon Cafe" no identifica a nadie: es lo que ya decia el pie antes.
    const { container } = await abrir('#aviso-legal');
    expect(container.querySelector('.legal').textContent).not.toBe(negocio.nombre);
    expect(negocio.titular).not.toBe(negocio.nombre);
  });
});

describe('politica de privacidad (RGPD arts. 13-14)', () => {
  it('identifica al responsable con nombre y NIF', async () => {
    const { container } = await abrir('#privacidad');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain(negocio.titular);
    expect(texto).toContain(negocio.nif);
  });

  it('declara el dato que se guarda en el navegador', async () => {
    // Exento de consentimiento (art. 22.2 LSSI), pero hay que declararlo.
    const { container } = await abrir('#privacidad');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('diagon:idioma');
    // El mapa dejo de guardar nada: si vuelve a hacerlo, hay que declararlo.
    expect(texto).not.toContain('diagon:mapa');
  });

  it('dice que el mapa es una imagen propia y no un mapa de Google', async () => {
    const { container } = await abrir('#privacidad');
    expect(container.querySelector('.legal').textContent).toContain('OpenStreetMap');
  });

  it('declara la transferencia internacional del alojamiento', async () => {
    const { container } = await abrir('#privacidad');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('GitHub');
    expect(texto).toMatch(/Estados Unidos/);
  });

  it('explica los derechos y la autoridad de control', async () => {
    const { container } = await abrir('#privacidad');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('portabilidad');
    expect(texto).toContain('Agencia Española de Protección de Datos');
  });

  it('dice por que base juridica se trata cada cosa', async () => {
    const { container } = await abrir('#privacidad');
    const texto = container.querySelector('.legal').textContent;

    expect(texto).toContain('6.1.f');
    expect(texto).toContain('6.1.b');
    // Ya no hay ningun tratamiento que dependa del consentimiento: el mapa dejo
    // de ser un iframe de Google y no queda nada que pedir (art. 6.1.a).
    expect(texto).not.toContain('6.1.a');
  });
});

describe('paginas legales en los cuatro idiomas', () => {
  it('el aviso legal se sirve en el idioma elegido', async () => {
    await abrir('#aviso-legal', 'de');
    expect(screen.getByRole('heading', { level: 1, name: legalDe.aviso.titulo }))
      .toBeInTheDocument();
  });

  it('cambiar de idioma cambia el texto legal sin salir de la pagina', async () => {
    const usuario = userEvent.setup();
    await abrir('#privacidad', 'es');

    await usuario.click(screen.getByRole('button', { name: de.idioma }));

    expect(await screen.findByRole('heading', { level: 1, name: legalDe.privacidad.titulo }))
      .toBeInTheDocument();
  });

  it('cada pagina legal enlaza a la otra', async () => {
    const usuario = userEvent.setup();
    const { container } = await abrir('#aviso-legal');

    const enlaces = [...container.querySelectorAll('.legal__pie a')];
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual(['#privacidad', '#inicio']);

    await usuario.click(enlaces[0]);
    expect(await screen.findByRole('heading', { level: 1, name: legalEs.privacidad.titulo }))
      .toBeInTheDocument();
  });
});
