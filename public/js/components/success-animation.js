const SRC = '/assets/terimakasih.webp';
const DURATION = 2600;

let current = null;

export function showThanks() {
  current?.remove();

  const el = document.createElement('div');
  el.className = 'thanks';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="thanks-card">
      <img src="${SRC}" alt="" width="240" height="240" draggable="false" />
      <span class="thanks-spark thanks-spark--1"></span>
      <span class="thanks-spark thanks-spark--2"></span>
      <span class="thanks-heart thanks-heart--1">♥</span>
      <span class="thanks-heart thanks-heart--2">♥</span>
      <span class="thanks-heart thanks-heart--3">♥</span>
    </div>`;
  document.body.append(el);
  current = el;

  const close = () => {
    el.classList.add('is-leaving');
    setTimeout(() => { el.remove(); if (current === el) current = null; }, 300);
  };
  el.addEventListener('click', close);
  setTimeout(close, DURATION);
}
