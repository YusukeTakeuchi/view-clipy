const Realm = require("realm");
const fs = require("fs");
const os = require("os");
const path = require("path");

// CPYClipスキーマの定義
const CPYClipSchema = {
  name: 'CPYClip',
  primaryKey: 'dataHash',
  properties: {
    dataPath: 'string',
    title: 'string',
    dataHash: 'string',
    primaryType: 'string',
    updateTime: 'int',
    thumbnailPath: 'string',
    isColorCode: 'bool',
  }
};

const realmPath = process.argv[2];

if (!realmPath) {
  console.error("Please provide the path to the Realm file as an argument.");
  process.exit(1);
}

async function displayClips() {
  let realm;
  let tmpRealmPath;
  try {
    tmpRealmPath = await copyRealmFileToTemporaryFile(realmPath);
    const realmConfig = {
      path: tmpRealmPath,
      schema: [CPYClipSchema],
      schemaVersion: 7,
    };
    if (!Realm.exists(realmConfig)) {
      console.error("Unable to open Realm file at path:", realmPath);
      process.exit(1);
    }
    // Realmを開く
    realm = await Realm.open(realmConfig);

    // updateTimeで降順にCPYClipオブジェクトをソート
    const sortedClips = realm.objects('CPYClip').sorted('updateTime', true);

    // 結果を配列に変換し、JSON形式にエンコード
    const clipsArray = Array.from(sortedClips).map(clip => ({
      updateTime: clip.updateTime,
      title: clip.title,
    }));

    const jsonOutput = JSON.stringify(clipsArray, null, 2); // 整形して出力
    console.log(jsonOutput);
  } catch (error) {
    console.error("Error opening Realm:", error.message);
  } finally {
    // 一時ファイルを削除
    if (tmpRealmPath) {
      fs.unlinkSync(tmpRealmPath);
    }
    if (realm) {
      realm.close();
    }
  }
  process.exit(0);
}

async function copyRealmFileToTemporaryFile(realmPath) {
  const temporaryPath = path.join(os.tmpdir(), "temp.realm");
  fs.copyFileSync(realmPath, temporaryPath);
  return temporaryPath;
}

displayClips();
