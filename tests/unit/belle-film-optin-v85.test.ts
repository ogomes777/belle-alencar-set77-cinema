/// <reference types="vite/client" />
import { describe, it, expect } from 'vitest';
import markup from '../../index.html?raw';
import film from '../../src/film.ts?raw';
import main from '../../src/main.ts?raw';

describe('Belle V85 · passarela leads and boutique film is opt-in',()=>{
  const first=markup.indexOf('<section class="runway"');
  const movie=markup.indexOf('<section class="film"');
  const ticker=markup.indexOf('<section class="manifesto manifesto--ticker"');
  it('opens at the runway, with the boutique film second and couture rail after it',()=>{
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(movie);
    expect(movie).toBeLessThan(ticker);
    expect(markup.match(/id="inicio"/g)).toHaveLength(1);
    expect(markup).toContain('id="passarela"');
    expect(markup).toContain('id="filme-vitrine"');
    expect(markup).toContain('href="#filme-vitrine" data-chapter-link="filme-vitrine"');
    expect(markup).toContain('href="#filme" data-mobile-nav');
  });
  it('keeps a visible boutique entrance lock and deliberate enter/exit controls',()=>{
    expect(markup).toContain('id="filmGateway"');
    expect(markup).toContain('data-monogram="header"');
    expect(markup).toContain('film__gateway-lock-arch');
    expect(markup).toContain('id="filmEnter"');
    expect(markup).toContain('aria-controls="filmChapters"');
    expect(markup).toContain('Entrar na experiência');
    expect(markup).toContain('id="filmExit" hidden');
    expect(markup).toContain('Voltar à landing');
  });
  it('keeps every existing chapter, 3D world and original scene progression',()=>{
    const chapters=['vitrine','porta','sala','vestido','detalhe','categorias','provador'];
    for(const chapter of chapters)expect(markup).toContain('data-chapter="'+chapter+'"');
    expect((markup.match(/data-chapter="/g)??[])).toHaveLength(7);
    expect(film).toContain("const worldModule = import('./experience')");
    expect(film).toContain('world?.setProgress(progress)');
    expect(film).toContain('mod.initReveals(film!)');
    expect(markup).toContain('data-v54-rotunda');
    expect(markup).toContain('data-v79-spin-mount');
  });
  it('never starts WebGL, card scrub or chapter rail from passive landing scroll',()=>{
    expect(film).toContain('let experienceUnlocked=Boolean(posterMode)');
    expect(film).toContain("if(!experienceUnlocked)return; // locked facade never scrubs");
    expect(film).toContain("if (!experienceUnlocked || world || loading || tier === 'static') return;");
    expect(film).toContain("else if (experienceUnlocked && tier !== 'static')");
    expect(film).toContain('if(!experienceUnlocked)return;');
  });
  it('unlocks the full scroll experience and exits without stranding the user',()=>{
    expect(film).toContain('function enterExperience():void');
    expect(film).toContain('function leaveExperience():void');
    expect(film).toContain("film!.classList.add('is-unlocked')");
    expect(film).toContain("film!.classList.remove('is-unlocked')");
    expect(film).toContain("stopWorld(); // abort any in-flight renderer");
    expect(film).toContain("enterButton?.focus({preventScroll:true})");
    expect(film).toContain("if(exitButton)exitButton.hidden=true");
    expect(main).toContain("import './styles/belle-v85-optin-film.css'");
  });
});
