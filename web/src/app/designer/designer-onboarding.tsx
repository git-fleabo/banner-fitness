"use client";

import { useState } from "react";
import { createClientAction } from "./actions";

const WEEKDAYS = [
  { value: 1, label: "Monday" }, { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" }, { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" }, { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export function ClientOnboarding({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    name: string,
    riskCount: number,
    clientId: string,
    guideNext: boolean,
  ) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sexOrGender, setSexOrGender] = useState("");
  const [trainingExperience, setTrainingExperience] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [occupation, setOccupation] = useState("");
  const [dailyActivity, setDailyActivity] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [ptNotes, setPtNotes] = useState("");
  const [goalType, setGoalType] = useState("General fitness");
  const [trainingDays, setTrainingDays] = useState(3);
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 3, 5]);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(45);
  const [locationName, setLocationName] = useState("Commercial gym");
  const [locationType, setLocationType] = useState("Full gym");
  const [equipment, setEquipment] = useState([
    "Dumbbells",
    "Machines",
    "Cable",
  ]);
  const [screening, setScreening] = useState({
    chestPain: false,
    cardiovascularHistory: false,
    dizzinessOrFainting: false,
    unusualBreathlessness: false,
    diagnosedDisease: false,
    medicalIssue: false,
    medicationAffectingExercise: false,
    recentSurgery: false,
    injuryOrMusculoskeletalLimitation: false,
    pregnancyOrPostpartum: false,
    otherConcern: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [guideNext, setGuideNext] = useState(true);
  const riskQuestions: Array<[keyof typeof screening, string]> = [
    ["chestPain", "Chest pain or discomfort during activity?"],
    [
      "cardiovascularHistory",
      "Known cardiovascular disease, history or symptoms?",
    ],
    [
      "dizzinessOrFainting",
      "Dizziness, fainting or unexplained light-headedness?",
    ],
    [
      "unusualBreathlessness",
      "Unusual shortness of breath at rest or with ordinary activity?",
    ],
    ["diagnosedDisease", "Known metabolic, cardiovascular or renal disease?"],
    ["medicalIssue", "Current medical issue needing consideration?"],
    [
      "medicationAffectingExercise",
      "Medication that may affect exercise response?",
    ],
    ["recentSurgery", "Recent surgery or procedure?"],
    [
      "injuryOrMusculoskeletalLimitation",
      "Current injury, pain or musculoskeletal limitation?",
    ],
    [
      "pregnancyOrPostpartum",
      "Pregnant, recently postpartum or pregnancy-related considerations?",
    ],
    ["otherConcern", "Any other health concern requiring professional review?"],
  ];
  function toggleEquipment(item: string) {
    setEquipment((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }
  function togglePreferredDay(day: number) {
    setPreferredDays((current) => {
      const next = current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b);
      setTrainingDays(next.length);
      return next.length ? next : current;
    });
  }
  function setTrainingDayCount(count: number) {
    setTrainingDays(count);
    setPreferredDays((current) =>
      current.length >= count
        ? current.slice(0, count)
        : [
            ...current,
            ...WEEKDAYS.map((day) => day.value).filter(
              (day) => !current.includes(day),
            ),
          ].slice(0, count),
    );
  }
  async function submit() {
    setSaving(true);
    setError("");
    try {
      const result = await createClientAction({
        firstName,
        lastName,
        email,
        dateOfBirth,
        sexOrGender,
        trainingExperience,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        occupation,
        dailyActivity,
        sleepHours,
        stressLevel,
        ptNotes,
        goalType,
        trainingDays,
        preferredDays,
        sessionDurationMinutes,
        locationName,
        locationType,
        equipment,
        screening,
      });
      onCreated(
        `${firstName.trim()} ${lastName.trim()}`,
        result.riskFlags.length,
        result.clientId,
        guideNext,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Client could not be created",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="workspace-overlay">
      <div className="onboarding-drawer">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">NEW CLIENT</p>
            <h1>Start a client profile</h1>
            <p className="panel-muted">
              Capture the starting context now, then optionally follow the
              guided path through the rest of onboarding.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="onboarding-body">
          <section className="onboarding-section">
            <div className="section-title">
              <span>01</span>
              <div>
                <h2>Client details</h2>
                <p>Personal information and the first programming variables.</p>
              </div>
            </div>
            <div className="onboarding-fields">
              <label>
                FIRST NAME
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Maya"
                />
              </label>
              <label>
                LAST NAME
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Thompson"
                />
              </label>
              <label>
                EMAIL
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                DATE OF BIRTH
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                />
              </label>
              <label>
                SEX / GENDER
                <input
                  value={sexOrGender}
                  onChange={(event) => setSexOrGender(event.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                TRAINING EXPERIENCE
                <select
                  value={trainingExperience}
                  onChange={(event) => setTrainingExperience(event.target.value)}
                >
                  <option value="">Not recorded</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label>
                HEIGHT (CM)
                <input
                  type="number"
                  min="50"
                  max="260"
                  value={heightCm}
                  onChange={(event) => setHeightCm(event.target.value)}
                />
              </label>
              <label>
                WEIGHT (KG)
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={weightKg}
                  onChange={(event) => setWeightKg(event.target.value)}
                />
              </label>
              <label>
                OCCUPATION
                <input
                  value={occupation}
                  onChange={(event) => setOccupation(event.target.value)}
                />
              </label>
              <label>
                DAILY ACTIVITY
                <textarea
                  value={dailyActivity}
                  onChange={(event) => setDailyActivity(event.target.value)}
                  placeholder="Typical movement outside training"
                />
              </label>
              <label>
                SLEEP
                <input
                  value={sleepHours}
                  onChange={(event) => setSleepHours(event.target.value)}
                  placeholder="7–8 hours"
                />
              </label>
              <label>
                STRESS
                <select
                  value={stressLevel}
                  onChange={(event) => setStressLevel(event.target.value)}
                >
                  <option value="">Not recorded</option>
                  <option>Low</option>
                  <option>Moderate</option>
                  <option>High</option>
                </select>
              </label>
              <label className="wide-field">
                PT NOTES
                <textarea
                  value={ptNotes}
                  onChange={(event) => setPtNotes(event.target.value)}
                  placeholder="Goals, preferences, constraints and coaching observations…"
                />
              </label>
              <label>
                PRIMARY GOAL
                <select
                  value={goalType}
                  onChange={(event) => setGoalType(event.target.value)}
                >
                  <option>General fitness</option>
                  <option>Fat loss + muscle retention</option>
                  <option>General strength</option>
                  <option>Hypertrophy</option>
                  <option>Cardiovascular fitness</option>
                  <option>Movement quality</option>
                </select>
              </label>
              <label>
                SESSION LENGTH
                <select
                  value={sessionDurationMinutes}
                  onChange={(event) =>
                    setSessionDurationMinutes(Number(event.target.value))
                  }
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={75}>75 minutes</option>
                </select>
              </label>
            </div>
            <label className="wide-field">
              TRAINING DAYS PER WEEK
              <div className="training-frequency-picker">
                {Array.from({ length: 7 }, (_, index) => index + 1).map(
                  (day) => (
                    <button
                      type="button"
                      key={day}
                      className={trainingDays === day ? "selected" : ""}
                      onClick={() => setTrainingDayCount(day)}
                    >
                      {day}
                    </button>
                  ),
                )}
              </div>
            </label>
            <label className="wide-field">
              PREFERRED WEEKDAYS
              <div className="weekday-picker">
                {WEEKDAYS.map((day) => (
                  <button
                    type="button"
                    key={day.value}
                    className={
                      preferredDays.includes(day.value) ? "selected" : ""
                    }
                    onClick={() => togglePreferredDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <small className="panel-muted">
                Selected:{" "}
                {preferredDays
                  .map(
                    (day) =>
                      WEEKDAYS.find((option) => option.value === day)?.label,
                  )
                  .join(", ")}
              </small>
            </label>
          </section>
          <section className="onboarding-section">
            <div className="section-title">
              <span>02</span>
              <div>
                <h2>Location & equipment</h2>
                <p>
                  Exercises will be filtered against this location unless you
                  override it.
                </p>
              </div>
            </div>
            <div className="onboarding-fields">
              <label>
                Location name
                <input
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
                />
              </label>
              <label>
                Location type
                <select
                  value={locationType}
                  onChange={(event) => setLocationType(event.target.value)}
                >
                  <option>Full gym</option>
                  <option>Home gym</option>
                  <option>Minimal equipment</option>
                  <option>Outdoor</option>
                </select>
              </label>
            </div>
            <p className="equipment-help">
              Select only equipment confirmed at this location. Unchecked items
              stay unverified for programme quality checks.
            </p>
            <div className="equipment-picker">
              {[
                "Dumbbells",
                "Machines",
                "Cable",
                "Barbell",
                "Bands",
                "Bike",
                "Kettlebell",
              ].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={equipment.includes(item) ? "chosen" : ""}
                  onClick={() => toggleEquipment(item)}
                >
                  {equipment.includes(item) ? "✓ " : "+ "}
                  {item}
                </button>
              ))}
            </div>
          </section>
          <section className="onboarding-section screening-section">
            <div className="section-title">
              <span>03</span>
              <div>
                <h2>Initial screening</h2>
                <p>
                  These flags do not diagnose. They help the PT decide whether
                  additional screening, referral or clearance is appropriate.
                </p>
              </div>
            </div>
            <div className="screening-grid">
              {riskQuestions.map(([key, label]) => (
                <label
                  key={key}
                  className={
                    screening[key]
                      ? "screening-choice flagged"
                      : "screening-choice"
                  }
                >
                  <input
                    type="checkbox"
                    checked={screening[key]}
                    onChange={(event) =>
                      setScreening({
                        ...screening,
                        [key]: event.target.checked,
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="screening-note">
              Any positive response will be recorded on the assessment and kept
              visible to the PT before programme finalisation.
            </p>
          </section>
          <label className="onboarding-guide-choice">
            <input
              type="checkbox"
              checked={guideNext}
              onChange={(event) => setGuideNext(event.target.checked)}
            />
            <span>
              <strong>Guide me through the remaining onboarding</strong>
              <small>
                After creating the profile, step through assessment,
                preferences, location/equipment, programming and first workout
                logging. You can skip any stage.
              </small>
            </span>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <footer className="onboarding-footer">
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="primary-button"
              onClick={submit}
              disabled={saving || !firstName.trim() || !lastName.trim()}
            >
              {saving ? "Creating profile…" : "Create client profile →"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
