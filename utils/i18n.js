/**
 * utils/i18n.js - 中英文翻译
 * 用法: t('nav.home') 或 t('dashboard.hello', { name: 'Tom' })
 */

const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "locales");
const cache = {};

function loadLocale(lang) {
  if (!cache[lang]) {
    const file = path.join(LOCALES_DIR, `${lang}.json`);
    cache[lang] = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return cache[lang];
}

function getNested(obj, keyPath) {
  return keyPath.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function interpolate(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? vars[key] : `{${key}}`
  );
}

function translate(lang, key, vars = {}) {
  const safeLang = ["zh", "en"].includes(lang) ? lang : "en";
  let text = getNested(loadLocale(safeLang), key);
  if (text == null && safeLang !== "en") {
    text = getNested(loadLocale("en"), key);
  }
  if (text == null) return key;
  return interpolate(text, vars);
}

function createTranslator(lang) {
  return (key, vars) => translate(lang, key, vars);
}

/** 将 express-validator 的 msg 键翻译成当前语言 */
function translateErrors(t, errors) {
  return errors.map((e) => ({
    ...e,
    msg: e.msg && e.msg.startsWith("errors.") ? t(e.msg) : e.msg,
  }));
}

module.exports = {
  translate,
  createTranslator,
  translateErrors,
  supportedLangs: ["zh", "en"],
};
