const admin = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = require("./serviceAccountKey.json"); // sesuaikan nama file

const { initializeApp, cert } = admin;

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function setUserClaims(uid, role, isActive) {
  await auth.setCustomUserClaims(uid, {
    role: role,
    is_active: isActive
  });
  console.log(`✅ Claims set untuk UID: ${uid} — role: ${role}, is_active: ${isActive}`);
}

const users = [
  { uid: "ol72qlRbhtQ8hyPL5p6GQEZZ0Qe2", role: "MANAGER", is_active: true },
  { uid: "rsKbcgCC3LgS5syeh77XFKb0jex1", role: "ADMIN", is_active: true },
  { uid: "eWBPJaaOHpZCCg52ZMzJjj998Og2", role: "CASHIER", is_active: true },
  { uid: "bvsvZ2BpnqNHkTioNcwvTvw6znv2", role: "ADMIN", is_active: true },
];

(async () => {
  for (const u of users) {
    await setUserClaims(u.uid, u.role, u.is_active);
  }
  console.log("Selesai!");
  process.exit(0);
})();