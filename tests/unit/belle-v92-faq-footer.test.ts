/// <reference types="vite/client" />
import {describe,it,expect} from 'vitest';
import page from '../../index.html?raw';
import faqStyles from '../../src/styles/belle-v92-faq-footer.css?raw';
import ctaStyles from '../../src/styles/belle-v92-finale-cta.css?raw';
import main from '../../src/main.ts?raw';
import footerLogic from '../../src/study/v92-faq-footer.ts?raw';

describe('Belle V92 · approved closing pages',()=>{
  it('keeps exactly the original six FAQ items and no laboratory theme select',()=>{
    const faq=page.slice(page.indexOf('<section class="faq faq--studio"'),page.indexOf('<!-- 11 · ÚLTIMA PÁGINA -->'));
    expect((faq.match(/<details>/g)??[])).toHaveLength(6);
    expect(faq).toContain('Antes de');
    expect(faq).toContain('escolher.');
    expect(faq).not.toContain('v89ThemeControl');
    expect(faqStyles).toContain('data-belle-theme="rose"');
  });
  it('preserves actual 3D BA monogram and real WhatsApp and Instagram actions',()=>{
    expect(page).toContain('data-finale-solid');
    expect(page).toContain('class="finale__mark finale__mark--solid"');
    expect(page).toContain('class="btn btn--solid belle-neon belle-neon--wa"');
    expect(page).toContain('href="https://wa.me/message/YYDB5NC7JMUQP1"');
    expect(page).toContain('class="btn btn--line belle-neon belle-neon--ig"');
    expect(page).toContain('data-instagram-directory');
    expect(ctaStyles).toContain('.finale .finale__actions .belle-neon');
    expect(ctaStyles).toContain('animation:none!important');
  });
  it('keeps spinning original SET77 logo, original footer controls and safe signup demo',()=>{
    expect(page).toContain('class="v89-footer__ribbon"');
    expect(page).toContain('id="v89NewsletterStudy"');
    expect(page).toContain('Nenhum e-mail é enviado');
    expect(page).toContain('id="directorToggle"');
    expect(faqStyles).toContain('@keyframes v89Set77CreditSpin');
    expect(faqStyles).toContain('data:image/webp;base64,');
    expect(footerLogic).toContain("event.preventDefault()");
    expect(footerLogic).toContain("setBelleTheme");
  });
  it('keeps every unrelated campaign asset, navigation and the V88 ribbon',()=>{
    expect(page).toContain('banner-v86-assinatura-branca-4k.webp');
    expect(page).toContain('banner-v86-editorial-branco-4k.webp');
    expect(page).toContain('id="belleMenuButton"');
    expect(page).toContain('id="belleInstagramDialog"');
    expect(page).toContain('v88-ba-monogram-outline');
    expect(main).toContain("belle-v92-faq-footer.css");
    expect(main).toContain("belle-v92-finale-cta.css");
  });
});
