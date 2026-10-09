/**
 * Renderer 入口：按序加载 reset -> UnoCSS 原子化样式 -> 自定义样式。
 */
import '@unocss/reset/tailwind.css';
import 'virtual:uno.css';
import './index.css';
