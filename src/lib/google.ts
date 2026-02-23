import { google } from "googleapis";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

export function getDocsClient() {
  return google.docs({ version: "v1", auth: getAuth() });
}

export function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export async function createGoogleDoc(title: string): Promise<{
  docId: string;
  url: string;
}> {
  const docs = getDocsClient();
  const doc = await docs.documents.create({ requestBody: { title } });
  const docId = doc.data.documentId!;

  // Move to shared folder if configured
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId) {
    const drive = getDriveClient();
    await drive.files.update({
      fileId: docId,
      addParents: folderId,
      removeParents: "root",
    });
  }

  return {
    docId,
    url: `https://docs.google.com/document/d/${docId}/edit`,
  };
}

export async function createGoogleSheet(title: string): Promise<{
  sheetId: string;
  url: string;
}> {
  const sheets = getSheetsClient();
  const sheet = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
  });
  const sheetId = sheet.data.spreadsheetId!;

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId) {
    const drive = getDriveClient();
    await drive.files.update({
      fileId: sheetId,
      addParents: folderId,
      removeParents: "root",
    });
  }

  return {
    sheetId,
    url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
  };
}

export async function shareWithUser(fileId: string, email: string) {
  const drive = getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "user",
      role: "writer",
      emailAddress: email,
    },
  });
}
