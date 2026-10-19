// Seeds realistic demo data: admins, Danish users and companies, power-of-attorney templates,
// issued / acknowledged / revoked / expired e-fuldmagts, pending and rejected requests, notifications.
//
//   node scripts/seed-demo.js                   → the database in MONGO_CONNECTION
//   SEED_DB=efuldmagt_demo node scripts/seed-demo.js → another database on the same cluster
//
// Safe to re-run: it removes only its own records (emails @efuldmagt.example, its template titles)
// and rebuilds them. Everything else in the database is left alone.
// Signature images come from scripts/demo-signatures.mjs (run that once first).
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/admin");
const User = require("../models/user");
const Company = require("../models/company");
const FuldmagtForm = require("../models/fuldmagtForm");
const Fuldmagt = require("../models/fuldmagt");
const FuldmagtRequest = require("../models/fuldmagtRequests");
const Notification = require("../models/notification");
const NotificationSetting = require("../models/notificationSettings");

const DOMAIN = "efuldmagt.example"; // reserved TLD: mail to it can never be delivered
const PIN = "2026";
const ADMIN_PASSWORD = "Efuldmagt@2026";
const SIGNATURES = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/demo/signatures`;
const ICON = (name) => `https://cdn.jsdelivr.net/npm/heroicons@2.0.13/24/outline/${name}.svg`;
const avatar = (name, bg) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=256&bold=true`;
const slug = (name) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/[^a-z]+/g, "-");
const now = Date.now();
const days = (n) => new Date(now + n * 864e5);
const hours = (n) => new Date(now + n * 36e5);

function connectionString() {
  const uri = process.env.MONGO_CONNECTION;
  if (!process.env.SEED_DB) return uri;
  const u = new URL(uri);
  u.pathname = `/${process.env.SEED_DB}`;
  return u.toString();
}

// ---------- people ----------
const PEOPLE = [
  { first: "Mette", last: "Jensen", dob: "1986-04-12", phone: 20114521, color: "2563eb", address: ["Vesterbrogade 112", "2. tv", "1620", "København V"], mitId: true },
  { first: "Lars", last: "Nielsen", dob: "1979-09-03", phone: 20118734, color: "0f766e", address: ["Nørregade 7", "1. th", "8000", "Aarhus C"], mitId: true },
  { first: "Sofie", last: "Hansen", dob: "1991-01-27", phone: 20113390, color: "be185d", address: ["Strandvejen 44", "", "2900", "Hellerup"], mitId: true },
  { first: "Mads", last: "Pedersen", dob: "1983-06-18", phone: 20117702, color: "7c3aed", address: ["Kongensgade 19", "3. sal", "5000", "Odense C"] },
  { first: "Freja", last: "Andersen", dob: "1995-11-02", phone: 20112266, color: "ea580c", address: ["Boulevarden 23", "", "9000", "Aalborg"] },
  { first: "Rasmus", last: "Christensen", dob: "1975-02-09", phone: 20119041, color: "0369a1", address: ["Algade 5", "st.", "4000", "Roskilde"], mitId: true },
  { first: "Ida", last: "Larsen", dob: "1988-08-21", phone: 20115580, color: "15803d", address: ["Jernbanegade 31", "", "6700", "Esbjerg"] },
  { first: "Oliver", last: "Sørensen", dob: "1993-03-14", phone: 20116617, color: "b45309", address: ["Torvegade 2", "4. mf", "7100", "Vejle"] },
];
const fullName = (p) => `${p.first} ${p.last}`;
const emailOf = (p) => `${slug(p.first)}.${slug(p.last)}@${DOMAIN}`;

// ---------- templates (fields are listed in the same order the statement uses them) ----------
const tf = (key, placeholder) => ({ key, type: "textField", obj: { placeholder } });
const ta = (key, placeholder) => ({ key, type: "textArea", obj: { placeholder } });
const dt = (key, placeholder) => ({ key, type: "date", obj: { placeholder } });
const radio = (key, heading, options) => ({ key, type: "radioButtons", obj: { heading, options } });
const checks = (key, heading, options) => ({ key, type: "checkBoxes", obj: { heading, options } });
const NAME_FIELDS = [tf("FirstName", "First Name"), tf("LastName", "Last Name")];

const TEMPLATES = [
  {
    title: "Parcel pickup", icon: "truck", purchaseType: "Free",
    fields: [...NAME_FIELDS, tf("TrackingNumber", "Tracking number"), radio("Carrier", "Carrier", ["PostNord", "GLS", "DAO", "Bring"]), dt("PickupDate", "Pickup date")],
    statement: "I, $fuldmagtGiverName, authorise $FirstName $LastName to collect my parcel with tracking number $TrackingNumber from $Carrier on $PickupDate. The agent must show valid photo ID when collecting it.",
  },
  {
    title: "Car registration and inspection", icon: "wrench-screwdriver", purchaseType: "Free",
    fields: [...NAME_FIELDS, tf("LicencePlate", "Licence plate"), tf("VIN", "Vehicle identification number (VIN)"), checks("Tasks", "Tasks the agent may carry out", ["Periodic inspection (syn)", "Change of registration", "Collect number plates", "Pay the registration fee"])],
    statement: "I, $fuldmagtGiverName, authorise $FirstName $LastName to act on my behalf for the vehicle with licence plate $LicencePlate (VIN $VIN). The agent may handle: $Tasks.",
  },
  {
    title: "Collect prescription medicine", icon: "heart", purchaseType: "Free",
    fields: [...NAME_FIELDS, tf("Pharmacy", "Pharmacy (e.g. Apoteket Vesterbro)"), tf("PrescriptionReference", "Prescription reference")],
    statement: "I, $fuldmagtGiverName, authorise $FirstName $LastName to collect my prescription medicine at $Pharmacy, reference $PrescriptionReference, and to receive the related advice on my behalf.",
  },
  {
    title: "Tenancy and moving", icon: "home-modern", purchaseType: "Free",
    fields: [...NAME_FIELDS, tf("PropertyAddress", "Property address"), checks("Scope", "The agent may", ["Attend the move-in inspection", "Attend the move-out inspection", "Collect and return keys", "Sign the inspection report"]), dt("MoveDate", "Moving date")],
    statement: "I, $fuldmagtGiverName, authorise $FirstName $LastName to represent me for the tenancy at $PropertyAddress. The agent may: $Scope. This applies around the moving date $MoveDate.",
  },
  {
    title: "Bank errands", icon: "banknotes", purchaseType: "Tier 5",
    fields: [...NAME_FIELDS, tf("BankName", "Bank"), tf("AccountNumber", "Registration and account number"), radio("Scope", "Scope", ["View balance and statements", "Transfers up to DKK 10,000", "Close the account"])],
    statement: "I, $fuldmagtGiverName, authorise $FirstName $LastName to handle my account $AccountNumber at $BankName. The authority covers: $Scope.",
  },
  {
    title: "Tax and accounting (SKAT)", icon: "calculator", purchaseType: "Tier 10",
    fields: [...NAME_FIELDS, tf("CVRorCPR", "CVR or CPR number"), tf("TaxYear", "Income year"), ta("Instructions", "Instructions for the agent")],
    statement: "I, $fuldmagtGiverName, authorise $FirstName $LastName to deal with the Danish Tax Agency (Skattestyrelsen) for $CVRorCPR for the income year $TaxYear. Instructions: $Instructions",
  },
  {
    title: "General power of attorney", icon: "document-text", purchaseType: "Tier 20",
    fields: [...NAME_FIELDS, ta("Matters", "Which matters does this cover?"), dt("ValidFrom", "Valid from")],
    statement: "I, $fuldmagtGiverName, grant $FirstName $LastName general power of attorney to act on my behalf in the following matters: $Matters. The power of attorney applies from $ValidFrom until it is revoked.",
  },
];

async function main() {
  await mongoose.connect(connectionString(), { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db.databaseName;
  console.log(`seeding database "${db}"`);

  // ---------- clean previous demo data ----------
  const emailRe = new RegExp(`[@.]${DOMAIN.replace(".", "\\.")}$`); // people and company subdomains
  const oldUsers = await User.find({ email: emailRe }).select("_id").lean();
  const oldCompanies = await Company.find({ email: emailRe }).select("_id").lean();
  const oldIds = [...oldUsers, ...oldCompanies].map((d) => d._id);
  const oldForms = await FuldmagtForm.find({ title: { $in: TEMPLATES.map((t) => t.title) } }).select("_id").lean();
  const formIds = oldForms.map((f) => f._id);
  const involved = { $or: [{ fuldmagtGiverId: { $in: oldIds } }, { agentId: { $in: oldIds } }, { fuldmagtFormId: { $in: formIds } }, { agentEmail: emailRe }] };
  await Promise.all([
    Fuldmagt.deleteMany(involved),
    FuldmagtRequest.deleteMany(involved),
    Notification.deleteMany({ recipient: { $in: oldIds } }),
    NotificationSetting.deleteMany({ userId: { $in: oldUsers.map((u) => u._id) } }),
  ]);
  await Promise.all([
    FuldmagtForm.deleteMany({ _id: { $in: formIds } }),
    Company.deleteMany({ _id: { $in: oldCompanies.map((c) => c._id) } }),
    User.deleteMany({ _id: { $in: oldUsers.map((u) => u._id) } }),
    Admin.deleteMany({ email: emailRe }),
  ]);

  // ---------- admins ----------
  const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  await Admin.create([
    { name: "Demo Admin", email: `demo.admin@${DOMAIN}`, password: adminHash, noDelete: true },
    { name: "Platform Admin", email: `admin@${DOMAIN}`, password: adminHash },
  ]);

  // ---------- users ----------
  const pinHash = bcrypt.hashSync(PIN, 10);
  const users = {};
  for (const p of PEOPLE) {
    const name = fullName(p);
    const [address, addressLine, postalCode, city] = p.address;
    users[p.first] = await User.create({
      name: { firstName: p.first, lastName: p.last },
      email: emailOf(p),
      phone: { countryCode: "45", number: p.phone },
      dateOfBirth: new Date(p.dob),
      address: { address, addressLine, postalCode, city, country: "Denmark", setPrimary: true },
      image: avatar(name, p.color),
      pin: pinHash,
      signature: `${SIGNATURES}/${slug(name)}.png`,
      mitIdVerified: Boolean(p.mitId),
      lastUpdatedPassword: days(-40),
      isDemo: true,
    });
  }
  await NotificationSetting.insertMany(Object.values(users).map((u) => ({ userId: u._id })));

  // ---------- companies ----------
  const companies = {
    nordlys: await Company.create({
      createdBy: users.Lars._id, cvr: "41875230", companyName: "Nordlys Logistik ApS",
      address: { address: "Havnegade 18", addressLine: "Lager B", postalCode: "8000", city: "Aarhus C", country: "Denmark", setPrimary: true },
      phone: { countryCode: "45", number: 70201845 }, email: `kontakt@nordlys.${DOMAIN}`,
      image: avatar("Nordlys Logistik", "0f172a"), signature: `${SIGNATURES}/nordlys-logistik.png`,
    }),
    hansen: await Company.create({
      createdBy: users.Sofie._id, cvr: "39561207", companyName: "Hansen Ejendomme A/S",
      address: { address: "Strandvejen 44", addressLine: "2. sal", postalCode: "2900", city: "Hellerup", country: "Denmark", setPrimary: true },
      phone: { countryCode: "45", number: 70203391 }, email: `info@hansen-ejendomme.${DOMAIN}`,
      image: avatar("Hansen Ejendomme", "831843"), signature: `${SIGNATURES}/hansen-ejendomme.png`,
    }),
  };
  await User.updateOne({ _id: users.Lars._id }, { company: companies.nordlys._id });
  await User.updateOne({ _id: users.Sofie._id }, { company: companies.hansen._id });

  // ---------- templates ----------
  const PRICES = { Free: 0, "Tier 5": 25, "Tier 10": 45, "Tier 20": 99 };
  // SEED_ALL_FREE=1 makes every template free (public demo: no live payments can start)
  if (process.env.SEED_ALL_FREE) for (const t of TEMPLATES) t.purchaseType = "Free";
  const forms = {};
  for (const [i, t] of TEMPLATES.entries()) {
    forms[t.title] = await FuldmagtForm.create({
      title: t.title, icon: ICON(t.icon), fuldmagt_image: "",
      additionalFields: t.fields.map((f) => f.key),
      additionalFieldsType: t.fields.map((f) => f.type),
      additionalFieldsObject: t.fields.map((f) => f.obj),
      fuldmagtStatement: t.statement,
      isAgentSignRequired: false,
      purchaseType: t.purchaseType, price: PRICES[t.purchaseType],
      // exceptUsers with an empty list means "everyone", including people who sign up later
      visibleTo: "everyone", selectedUsers: [], selectedCompanies: [], exceptUsers: true, exceptCompanies: true,
      createdAt: days(-60 + i),
    });
  }

  // ---------- e-fuldmagts ----------
  const person = (first) => PEOPLE.find((p) => p.first === first);
  const fuldmagts = [];
  async function issue({ form, giver, agent, values, expiry, created, acknowledged = false, revoked = false }) {
    const g = users[giver], a = users[agent], gp = person(giver), ap = person(agent);
    const doc = await Fuldmagt.create({
      fuldmagtFormId: forms[form]._id, accountType: "user",
      giverModel: "user", fuldmagtGiverId: g._id, fuldmagtGiverImage: g.image, fuldmagtGiverName: fullName(gp),
      agentModel: "user", agentId: a._id, agentName: fullName(ap), agentDOB: new Date(ap.dob), agentEmail: emailOf(ap),
      agentPhone: { countryCode: "45", number: ap.phone },
      fuldmagtGiverSignature: g.signature, agentSignature: acknowledged ? a.signature : undefined,
      acknowledged, revoked, revokedDate: revoked ? days(-2) : undefined,
      expiry, createdAt: created, additionalFieldsData: [ap.first, ap.last, ...values],
      fuldmagtStatement: forms[form].fuldmagtStatement,
      fuldmagtDocumentsLink: [{ fuldmagtIssueDate: created }],
    });
    fuldmagts.push(doc);
    return doc;
  }
  const f1 = await issue({ form: "Parcel pickup", giver: "Mette", agent: "Lars", values: ["00370712345678901234", "PostNord", days(2).toISOString()], expiry: days(5), created: days(-1), acknowledged: true });
  const f2 = await issue({ form: "Car registration and inspection", giver: "Mette", agent: "Sofie", values: ["CP 41 872", "WVWZZZ1KZ8W123456", ["Periodic inspection (syn)", "Collect number plates"]], expiry: days(21), created: days(-3) });
  const f3 = await issue({ form: "Collect prescription medicine", giver: "Mette", agent: "Freja", values: ["Apoteket Vesterbro", "RX-2026-55871"], expiry: days(-4), created: days(-12), acknowledged: true });
  const f4 = await issue({ form: "Tenancy and moving", giver: "Mette", agent: "Mads", values: ["Gothersgade 9, 1123 København K", ["Attend the move-in inspection", "Collect and return keys"], days(9).toISOString()], expiry: days(30), created: days(-8), revoked: true });
  const f5 = await issue({ form: "General power of attorney", giver: "Ida", agent: "Mette", values: ["Contact with my insurance company and the municipality about my home care", days(-5).toISOString()], expiry: days(180), created: days(-5), acknowledged: true });
  const f6 = await issue({ form: "Parcel pickup", giver: "Lars", agent: "Mette", values: ["JD014600003828510742", "GLS", days(1).toISOString()], expiry: hours(30), created: hours(-5) });
  await issue({ form: "Bank errands", giver: "Oliver", agent: "Rasmus", values: ["Danske Bank", "3409 4567891234", "View balance and statements"], expiry: days(60), created: days(-15), acknowledged: true });
  await issue({ form: "Car registration and inspection", giver: "Rasmus", agent: "Ida", values: ["BX 77 310", "YV1MW8450L1234567", ["Change of registration", "Pay the registration fee"]], expiry: days(14), created: days(-6) });
  await issue({ form: "Tax and accounting (SKAT)", giver: "Freja", agent: "Lars", values: ["120395-1234", "2025", "Submit the annual return (årsopgørelse) and correct the deduction for transport."], expiry: days(90), created: days(-20), acknowledged: true });
  await issue({ form: "Parcel pickup", giver: "Sofie", agent: "Oliver", values: ["00370798765432109876", "DAO", days(-6).toISOString()], expiry: days(-5), created: days(-9), acknowledged: true });
  await issue({ form: "Collect prescription medicine", giver: "Mads", agent: "Sofie", values: ["Løve Apotek Odense", "RX-2026-60213"], expiry: days(7), created: days(-2) });

  // ---------- requests ----------
  async function request({ form, giver, agent, values, expiry, created, status = "pending" }) {
    const g = users[giver], a = users[agent], gp = person(giver), ap = person(agent);
    return FuldmagtRequest.create({
      fuldmagtFormId: forms[form]._id, accountType: "user",
      giverModel: "user", fuldmagtGiverId: g._id, fuldmagtGiverImage: g.image, fuldmagtGiverName: fullName(gp),
      fuldmagtGiverEmail: emailOf(gp), fuldmagtGiverPhone: { countryCode: "45", number: gp.phone },
      agentModel: "user", agentId: a._id, agentName: fullName(ap), agentDOB: new Date(ap.dob), agentEmail: emailOf(ap),
      agentPhone: { countryCode: "45", number: ap.phone },
      expiry, createdAt: created, additionalFieldsData: [ap.first, ap.last, ...values],
      fuldmagtStatement: forms[form].fuldmagtStatement, requestStatus: status,
    });
  }
  // Rasmus asks Mette for a power of attorney (Mette approves or rejects it in the demo)
  const r1 = await request({ form: "Tenancy and moving", giver: "Mette", agent: "Rasmus", values: ["Gothersgade 9, 1123 København K", ["Attend the move-out inspection", "Sign the inspection report"], days(12).toISOString()], expiry: days(20), created: hours(-3) });
  // Mette has asked Oliver for one
  await request({ form: "Car registration and inspection", giver: "Oliver", agent: "Mette", values: ["DK 12 345", "WAUZZZ8V2KA012345", ["Periodic inspection (syn)"]], expiry: days(10), created: days(-1) });
  await request({ form: "Parcel pickup", giver: "Mads", agent: "Freja", values: ["00370700011122233344", "Bring", days(3).toISOString()], expiry: days(4), created: days(-2), status: "rejected" });

  // ---------- notifications for the main demo user ----------
  const n = (recipient, title, body, data, ago, read = false) => ({ recipient, title, body, data, createdAt: hours(-ago), read });
  await Notification.insertMany([
    n(users.Mette._id, "New e-fuldmagt request", "Rasmus Christensen has asked you for a power of attorney: Tenancy and moving.", { actionType: "request_fuldmagt", fuldmagtRequestId: r1._id }, 3),
    n(users.Mette._id, "You received an e-fuldmagt", "Lars Nielsen gave you a power of attorney: Parcel pickup.", { actionType: "create_fuldmagt", fuldmagtId: f6._id }, 5),
    n(users.Mette._id, "e-fuldmagt acknowledged", "Lars Nielsen signed and acknowledged your Parcel pickup power of attorney.", { actionType: "acknowledge_fuldmagt", fuldmagtId: f1._id }, 20, true),
    n(users.Mette._id, "e-fuldmagt revoked", "You revoked the Tenancy and moving power of attorney for Mads Pedersen.", { actionType: "revoke_fuldmagt", fuldmagtId: f4._id }, 48, true),
    n(users.Mette._id, "You received an e-fuldmagt", "Ida Larsen gave you a general power of attorney.", { actionType: "create_fuldmagt", fuldmagtId: f5._id }, 120, true),
    n(users.Lars._id, "You received an e-fuldmagt", "Mette Jensen gave you a power of attorney: Parcel pickup.", { actionType: "create_fuldmagt", fuldmagtId: f1._id }, 24, true),
    n(users.Sofie._id, "You received an e-fuldmagt", "Mette Jensen gave you a power of attorney: Car registration and inspection.", { actionType: "create_fuldmagt", fuldmagtId: f2._id }, 72),
    n(users.Freja._id, "e-fuldmagt expired", "The Collect prescription medicine power of attorney from Mette Jensen has expired.", { actionType: "default" }, 96),
  ]);

  const counts = {
    admins: await Admin.countDocuments({ email: emailRe }), users: Object.keys(users).length, companies: 2,
    templates: TEMPLATES.length, fuldmagts: fuldmagts.length, requests: 3, notifications: 8,
  };
  console.log("done:", JSON.stringify(counts));
  console.log(`website login: ${emailOf(PEOPLE[0])} / PIN ${PIN}   (every demo user has PIN ${PIN})`);
  console.log(`admin login:   demo.admin@${DOMAIN} / ${ADMIN_PASSWORD} (no delete)   admin@${DOMAIN} / ${ADMIN_PASSWORD} (full)`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
