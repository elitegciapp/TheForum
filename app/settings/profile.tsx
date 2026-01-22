import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { router } from 'expo-router';
import {
  getMyProfile,
  type ProfessionOption,
  updateMyProfile,
} from '../../lib/profiles';

const PROFESSION_OPTIONS: ProfessionOption[] = [
  'Business Owner',
  'Entrepreneur',
  'Investor',
  'Real Estate Professional',
  'Attorney',
  'Finance / Banking',
  'Technology',
  'Healthcare',
  'Consulting',
  'Marketing / Media',
  'Other',
];

const YEARS_OPTIONS = [
  { label: '0–2', value: 0 },
  { label: '3–5', value: 3 },
  { label: '6–10', value: 6 },
  { label: '11–15', value: 11 },
  { label: '16+', value: 16 },
] as const;

export default function ProfileSettings() {
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState<string>('');
  const [professionOther, setProfessionOther] = useState('');
  const [industry, setIndustry] = useState('');
  const [primaryRole, setPrimaryRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p || cancelled) return;
        setDisplayName((p.display_name ?? p.username ?? '').toString());

        const prof = (p.profession ?? '').toString();
        setProfession(prof);
        if (prof && !PROFESSION_OPTIONS.includes(prof as any)) {
          setProfession('Other');
          setProfessionOther(prof);
        }

        setIndustry(((p.industry ?? '') as any).toString());
        setPrimaryRole(((p.primary_role ?? '') as any).toString());
        setYearsExperience(typeof p.years_experience === 'number' ? p.years_experience : null);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    const dn = displayName.trim();
    if (!dn) {
      Alert.alert('Required', 'Display name is required.');
      return;
    }

    const prof = (profession === 'Other' ? professionOther.trim() : profession).trim();
    if (!prof) {
      Alert.alert('Required', 'Profession is required.');
      return;
    }

    setLoading(true);
    try {
      await updateMyProfile({
        display_name: dn,
        profession: prof,
        industry: industry.trim() ? industry.trim() : null,
        primary_role: primaryRole.trim() ? primaryRole.trim() : null,
        years_experience: yearsExperience,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Profile</Text>
      <Text style={styles.sub}>Limited edits. Keep it professional.</Text>

      <Input label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Shown to other members" autoCapitalize="words" />

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Profession</Text>
        <View style={styles.optionsWrap}>
          {PROFESSION_OPTIONS.map((opt) => {
            const on = profession === opt;
            return (
              <Pressable key={opt} onPress={() => setProfession(opt)} style={[styles.option, on && styles.optionOn]}>
                <Text style={[styles.optionText, on && styles.optionTextOn]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {profession === 'Other' && (
        <Input
          label="Profession (Other)"
          value={professionOther}
          onChangeText={setProfessionOther}
          placeholder="Enter your profession"
          autoCapitalize="words"
        />
      )}

      <Input label="Industry (optional)" value={industry} onChangeText={setIndustry} placeholder="e.g., Real estate" autoCapitalize="words" />
      <Input label="Primary Role (optional)" value={primaryRole} onChangeText={setPrimaryRole} placeholder="e.g., Founder" autoCapitalize="words" />

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Years of Experience (optional)</Text>
        <View style={styles.optionsWrap}>
          {YEARS_OPTIONS.map((opt) => {
            const on = yearsExperience === opt.value;
            return (
              <Pressable
                key={opt.label}
                onPress={() => setYearsExperience((prev) => (prev === opt.value ? null : opt.value))}
                style={[styles.option, on && styles.optionOn]}
              >
                <Text style={[styles.optionText, on && styles.optionTextOn]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button title="Save" onPress={save} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 20, fontSize: 22, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  sub: { marginTop: 8, color: '#6B6257' },
  label: { color: '#3A332A', marginBottom: 8, fontWeight: '700' },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  optionOn: { backgroundColor: '#1E1A14', borderColor: '#1E1A14' },
  optionText: { color: '#1E1A14', fontWeight: '700' },
  optionTextOn: { color: '#FFFFFF', fontWeight: '800' },
});
