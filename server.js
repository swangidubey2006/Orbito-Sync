require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(express.static(__dirname));

function readUsers(){
  try { return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')); }
  catch { return {}; }
}
function writeUsers(users){ fs.writeFileSync(USERS_FILE, JSON.stringify(users,null,2)); }
function normalizeEmail(email){ return String(email||'').trim().toLowerCase(); }
function hashPassword(password){ return crypto.createHash('sha256').update(String(password)).digest('hex'); }
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function sendSignupEmail(name,email){
  const host=process.env.SMTP_HOST || 'smtp.gmail.com';
  const port=Number(process.env.SMTP_PORT || 465);
  const secure=String(process.env.SMTP_SECURE||'true')==='true';
  const user=process.env.SMTP_USER;
  const pass=process.env.SMTP_PASS;
  const from=process.env.EMAIL_FROM || user;
  if(!user || !pass) return {sent:false,error:'SMTP is not configured'};
  try{
    const transporter=nodemailer.createTransport({host,port,secure,auth:{user,pass}});
    const logoPath=path.join(__dirname,'assets','orbito-round-logo.png');
    await transporter.sendMail({
      from,
      to: email,
      subject:'Congratulations! You successfully signed up for Orbito 🎉',
      text:`Hi ${name},\n\nCongratulations! You have successfully signed up for Orbito. 🎉\n\nYour personal routine, reminders, voice assistant and dashboard are ready.\n\nYour day, in sync.\n\n— Team Orbito`,
      html:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#202638"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:18px 0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:1280px;background:#fff;border:1px solid #ececf1;border-radius:18px"><tr><td align="center" style="padding:44px 28px 48px"><img src="cid:orbito-logo" width="92" height="92" alt="Orbito" style="display:block;width:92px;height:92px;border-radius:50%;margin:0 auto 30px;border:0"><h1 style="margin:0 0 20px;font-size:40px;line-height:1.2;color:#202638;font-weight:800">Congratulations, ${escapeHtml(name)}! 🎉</h1><p style="margin:0 0 18px;font-size:20px;line-height:1.55;color:#4c5261">You have successfully signed up for <strong style="color:#ff6426">Orbito</strong>.</p><p style="margin:0 auto 28px;font-size:18px;line-height:1.65;color:#656b79">Your personal routine, reminders, voice assistant and dashboard are ready.</p><div style="display:inline-block;padding:12px 22px;border-radius:999px;background:#fff4ec;color:#ff6426;font-size:16px;font-weight:700">Your day, in sync.</div></td></tr></table></td></tr></table></body></html>`,
      attachments:[{content:require('fs').readFileSync(logoPath),cid:'orbito-logo',contentType:'image/png',contentDisposition:'inline'}]
    });
    return {sent:true};
  }catch(err){ console.error('SMTP error:',err.message); return {sent:false,error:'email send failed'}; }
}

app.post('/api/signup', async (req,res)=>{
  const name=String(req.body?.name||'').trim();
  const email=normalizeEmail(req.body?.email);
  const password=String(req.body?.password||'');
  if(name.length<2) return res.status(400).json({ok:false,error:'Please enter your full name.'});
  if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ok:false,error:'Please enter a valid email address.'});
  if(password.length<6) return res.status(400).json({ok:false,error:'Password must be at least 6 characters.'});
  const users=readUsers();
  if(users[email]) return res.status(409).json({ok:false,error:'An account already exists with this email. Please sign in.'});
  users[email]={name,email,passwordHash:hashPassword(password),createdAt:new Date().toISOString()};
  writeUsers(users);
  const mail=await sendSignupEmail(name,email);
  res.json({ok:true,account:{name,email},emailSent:mail.sent,emailError:mail.sent?null:mail.error});
});

app.post('/api/login',(req,res)=>{
  const email=normalizeEmail(req.body?.email);
  const password=String(req.body?.password||'');
  const users=readUsers();
  const user=users[email];
  if(!user) return res.status(404).json({ok:false,error:'Please sign up first.'});
  if(user.passwordHash!==hashPassword(password)) return res.status(401).json({ok:false,error:'Incorrect password. Please try again.'});
  res.json({ok:true,account:{name:user.name,email:user.email}});
});

app.get('/api/account-exists',(req,res)=>{
  const email=normalizeEmail(req.query.email);
  res.json({exists:!!readUsers()[email]});
});

app.listen(PORT,()=>console.log(`Orbito running at http://localhost:${PORT}`));
