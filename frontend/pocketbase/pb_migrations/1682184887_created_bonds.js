migrate((db) => {
  const collection = new Collection({
    "id": "hrl34g3xkdxh1qs",
    "created": "2023-04-22 17:34:47.512Z",
    "updated": "2023-04-22 17:34:47.512Z",
    "name": "bonds",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lgbatwgz",
        "name": "description",
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
        "id": "dq9voohm",
        "name": "address",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": "^0x[a-fA-F0-9]{40}$"
        }
      },
      {
        "system": false,
        "id": "r1qwy19c",
        "name": "active_date",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "lelg5ydh",
        "name": "maturity_date",
        "type": "date",
        "required": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "pnw8pb9c",
        "name": "kpis",
        "type": "json",
        "required": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs");

  return dao.deleteCollection(collection);
})
