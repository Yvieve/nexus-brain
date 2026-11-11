(()=>{'use strict';
 const $=id=>document.getElementById(id);let sending=false,saving=false,lastSent=0;
 function openRecovery(){if(SUP.DEMO_MODE||!window.nexusRecoverySession)return;$('loginModal').classList.remove('open');$('passwordResetModal').classList.add('open');$('newPassword').focus();}
 window.addEventListener('nexus-password-recovery',openRecovery);if(window.nexusRecoverySession)openRecovery();
 $('forgotPassword').onclick=async()=>{
  const status=$('loginErr'),email=$('loginEmail').value.trim();
  if(SUP.DEMO_MODE){status.textContent='演示入口不发送邮件，请打开正式账号入口。';return;}
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){status.textContent='请先填写你原账号的邮箱，再点击忘记密码。';return;}
  if(sending||Date.now()-lastSent<60000){status.textContent='请稍后重试，并检查收件箱和垃圾邮件。';return;}
  sending=true;$('forgotPassword').disabled=true;
  try{const result=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(!result||result.error)throw Error();lastSent=Date.now();status.textContent='重置请求已提交。如果该邮箱可接收恢复邮件，请查收并点击链接设置新密码；也请检查垃圾邮件。';}
  catch{status.textContent='重置请求未成功，请检查网络、邮箱发送限额及 Supabase 的允许跳转地址后重试。';}
  finally{sending=false;$('forgotPassword').disabled=false;}
 };
 function clear(){for(const id of ['newPassword','confirmPassword'])$(id).value='';}
 $('cancelPasswordReset').onclick=()=>{if(saving)return;clear();$('passwordResetModal').classList.remove('open');};
 $('passwordResetForm').onsubmit=async e=>{e.preventDefault();if(saving)return;const status=$('passwordResetStatus'),password=$('newPassword').value;
  if(!window.nexusRecoverySession){status.textContent='请重新从有效的密码恢复邮件进入。';return;}
  if(password.length<8){status.textContent='新密码至少需要 8 位。';return;}
  if(password!==$('confirmPassword').value){status.textContent='两次输入的密码不一致。';return;}
  saving=true;$('saveNewPassword').disabled=true;
  try{const{data,error}=await sb.auth.getSession();if(error||!data?.session)throw Error();const result=await sb.auth.updateUser({password});if(!result||result.error||!result.data?.user)throw Error();clear();window.nexusRecoverySession=false;$('passwordResetModal').classList.remove('open');toast('密码已更新，请妥善保管新密码。');}
  catch{clear();status.textContent='密码更新失败，恢复链接可能已失效或密码不符合要求。请重新申请恢复邮件。';}
  finally{saving=false;$('saveNewPassword').disabled=false;}
 };
})();
