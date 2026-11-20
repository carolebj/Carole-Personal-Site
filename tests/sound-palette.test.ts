import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { soundPalette, SOUND_LEVEL } from "../src/app/interactions/soundPalette.ts";

test("minimal palette retains approved board parameters and bounded headroom", () => {
  assert.deepEqual(Object.keys(soundPalette), ["primary", "secondary", "select", "open", "close", "on", "off"]);
  assert.equal(SOUND_LEVEL, .35);
  for (const spec of Object.values(soundPalette)) {
    assert.ok(spec.duration <= .11);
    assert.ok((spec.notes.reduce((sum, note) => sum + note.gain, 0) + spec.noise) * SOUND_LEVEL < .05);
  }
  assert.equal(soundPalette.primary.notes[0].f, 275);
  assert.equal(soundPalette.select.notes[0].f, 590);
  assert.ok(soundPalette.on.notes[1].f > soundPalette.on.notes[0].f);
  assert.ok(soundPalette.off.notes[1].f < soundPalette.off.notes[0].f);
});

test("semantic click coverage retains mute and real-transition ownership", () => {
  const source = readFileSync(new URL("../src/app/interactions/HapticContext.tsx", import.meta.url), "utf8");
  assert.ok(!source.includes('addEventListener("pointerover"'));
  assert.ok(!source.includes('play("click")'));
  assert.ok(source.includes('getAttribute("data-sound")'));
  assert.ok(source.includes('request !== requestRef.current'));
  assert.ok(source.includes('if (nextEnabled) playCue("on")'));
  assert.ok(source.includes('getItem(STORAGE_KEY) !== "off"'));
  assert.ok(source.includes('else playCue("secondary")'));
  assert.ok(source.includes('target.hasAttribute("aria-expanded")'));
  assert.ok(source.includes('suppressedCloseRef.current.delete(id)'));
  assert.ok(!source.includes('SOUND_CADENCE_MS'));
});
