import * as React from 'react';
import { createRoot } from 'react-dom/client';
import CubeRoll from '../components/originkit/CubeRollLetterRole';

/** Small, isolated React bridge. This is the user's exact Originkit component;
 * the existing vanilla Belle page and scroll systems remain unchanged. */
export function mountBelleOpeningCube(target: HTMLElement): () => void {
  const root=createRoot(target);
  root.render(
    <CubeRoll
      text="BELLE ALENCAR"
      tag="h2"
      color="#58203E"
      direction="down"
      stagger={0.092}
      perspective={820}
      sideOpacity={49}
      transition={{type:'tween',duration:0.82,ease:'linear'}}
      font={{
        fontFamily:'"DM Sans Variable", "DM Sans", sans-serif',
        fontWeight:100,
        fontSize:'clamp(2rem, 8.2vw, 8.25rem)',
        letterSpacing:'-.042em',
        lineHeight:1.28,
        textAlign:'center',
        whiteSpace:'nowrap',
      }}
    />
  );
  return ()=>root.unmount();
}
