import { getModelsForMake, getTrimOptionsForMakeModel } from "./autosVehicleTaxonomy";
import { getKnownTrimsForVehicle } from "./autosVehicleData";

export type AutosVehicleCoverageCase = {
  label: string;
  year: number;
  make: string;
  model: string;
  localMakeModelExists: boolean;
  localTrimDropdownExists: boolean;
  localTrimCount: number;
  manualFallbackExists: boolean;
  vinDecodeCanEnhance: boolean;
  decodedTrimCanBeCustomValue: boolean;
};

const CASES: { label: string; year: number; make: string; model: string }[] = [
  { label: "2014 Ford F-150", year: 2014, make: "Ford", model: "F-150" },
  { label: "2014 Hyundai Elantra", year: 2014, make: "Hyundai", model: "Elantra" },
  { label: "2020 Lincoln Corsair", year: 2020, make: "Lincoln", model: "Corsair" },
  { label: "2019 Toyota Camry", year: 2019, make: "Toyota", model: "Camry" },
  { label: "2018 Honda Civic", year: 2018, make: "Honda", model: "Civic" },
  { label: "2015 Chevrolet Silverado 1500", year: 2015, make: "Chevrolet", model: "Silverado 1500" },
  { label: "2016 Nissan Altima", year: 2016, make: "Nissan", model: "Altima" },
];

export function buildAutosVehicleDataCoverageReport(): AutosVehicleCoverageCase[] {
  return CASES.map((c) => {
    const models = getModelsForMake(c.make);
    const localMakeModelExists = models.some((m) => m.toLowerCase() === c.model.toLowerCase());
    const trims = getKnownTrimsForVehicle(c.year, c.make, c.model);
    const trimOpts = getTrimOptionsForMakeModel(c.make, c.model);
    const localTrimCount = Math.max(trims.length, trimOpts.length);
    return {
      label: c.label,
      year: c.year,
      make: c.make,
      model: c.model,
      localMakeModelExists,
      localTrimDropdownExists: localTrimCount > 0,
      localTrimCount,
      manualFallbackExists: true,
      vinDecodeCanEnhance: true,
      decodedTrimCanBeCustomValue: true,
    };
  });
}
