migrate((db) => {
  const collection = new Collection({
    "id": "li6e7ucnz6ptadw",
    "created": "2023-04-22 17:36:18.659Z",
    "updated": "2023-04-22 17:36:18.659Z",
    "name": "exchanges",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "0tdk6ox2",
        "name": "bond_id",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "hrl34g3xkdxh1qs",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": [
            "address"
          ]
        }
      },
      {
        "system": false,
        "id": "r0ehbuqr",
        "name": "is_amm",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
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
  const collection = dao.findCollectionByNameOrId("li6e7ucnz6ptadw");

  return dao.deleteCollection(collection);
})
