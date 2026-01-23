export type LootEntry = {
  name: string;
  weight: number;
};

export type LootPool = {
  name: string;
  entries: LootEntry[];
};

export type LootConfig = {
  pools: LootPool[];
};

export const lootConfig: LootConfig = {
  pools: [
    {
      name: "rarity",
      entries: [
        {
          name: "common",
          weight: 6000
        },
        {
          name: "uncommon",
          weight: 2500
        },
        {
          name: "rare",
          weight: 1000
        },
        {
          name: "epic",
          weight: 400
        },
        {
          name: "legendary",
          weight: 90
        },
        {
          name: "mythic",
          weight: 10
        }
      ]
    }
  ]
};