migrate((db) => {
  const collection = new Collection({
    "id": "xqvrfk7abq88609",
    "created": "2023-05-08 09:58:39.625Z",
    "updated": "2023-05-08 09:58:39.625Z",
    "name": "stable_coins",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qovvmwfe",
        "name": "name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "2ujtpxxw",
        "name": "symbol",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": 4,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "h0lmw70v",
        "name": "address",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": "^0x[a-fA-F0-9]{40}$"
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": "",
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("xqvrfk7abq88609");

  return dao.deleteCollection(collection);
})
