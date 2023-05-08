migrate((db) => {
  const collection = new Collection({
    "id": "9566dxf799fc6jx",
    "created": "2023-05-08 10:05:27.873Z",
    "updated": "2023-05-08 10:05:27.873Z",
    "name": "exchanges",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "uotcbvzj",
        "name": "address",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": "^0x[a-fA-F0-9]{40}$"
        }
      },
      {
        "system": false,
        "id": "xo8ukphr",
        "name": "bond",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "hrl34g3xkdxh1qs",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "0spob6lm",
        "name": "stable_coin",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "xqvrfk7abq88609",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_ll2f3OJ` ON `exchanges` (\n  `bond`,\n  `stable_coin`\n)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("9566dxf799fc6jx");

  return dao.deleteCollection(collection);
})
