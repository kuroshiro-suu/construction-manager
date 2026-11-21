/* 表示確認用。認証・送信・パスワード保存は行わない。 */
'use strict';
const password = document.getElementById('password');
const toggle = document.getElementById('toggle-password');
const feedback = document.getElementById('feedback');
toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.textContent = visible ? '隠す' : '表示';
  toggle.setAttribute('aria-pressed', String(visible));
});
function notify(message) {
  feedback.hidden = false;
  feedback.textContent = message;
}
document.getElementById('login-form').addEventListener('submit', event => {
  event.preventDefault();
  password.value = '';
  password.type = 'password';
  toggle.textContent = '表示';
  toggle.setAttribute('aria-pressed', 'false');
  notify('ログイン機能は準備中です。入力内容は送信・保存していません。');
});
document.querySelectorAll('[data-placeholder]').forEach(button => {
  button.addEventListener('click', () => notify(`${button.dataset.placeholder}の画面は、これから作成します。`));
});
