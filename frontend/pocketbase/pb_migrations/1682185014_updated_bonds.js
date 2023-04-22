migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "dq9voohm",
    "name": "address",
    "type": "text",
    "required": true,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": "^0x[a-fA-F0-9]{40}$"
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "r1qwy19c",
    "name": "active_date",
    "type": "date",
    "required": true,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lelg5ydh",
    "name": "maturity_date",
    "type": "date",
    "required": true,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "pnw8pb9c",
    "name": "kpis",
    "type": "json",
    "required": true,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hrl34g3xkdxh1qs")

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "pnw8pb9c",
    "name": "kpis",
    "type": "json",
    "required": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
})
