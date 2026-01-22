import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';
import { getMyProfile, type ProfessionOption, updateMyProfile } from '../../lib/profiles';

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

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance / Banking',
  'Real Estate',
  'Healthcare',
  'Legal',
  'Consulting',
  'Marketing / Media',
  'Other',
] as const;

const YEARS_OPTIONS = [
  { label: '0–2', value: 0 },
  { label: '3–5', value: 3 },
  { label: '6–10', value: 6 },
  { label: '11–15', value: 11 },
  { label: '16+', value: 16 },
] as const;

export default function Profession() {
  const [loading, setLoading] = useState(false);

  const [profession, setProfession] = useState<string>('');
  const [professionOther, setProfessionOther] = useState('');

  const [industry, setIndustry] = useState<string>('');
  const [industryOther, setIndustryOther] = useState('');

  const [primaryRole, setPrimaryRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p || cancelled) return;

        const prof = (p.profession ?? '').toString();
        setProfession(prof);
        if (prof && !PROFESSION_OPTIONS.includes(prof as any)) {
          setProfession('Other');
          setProfessionOther(prof);
        }

        const ind = (p.industry ?? '').toString();
        setIndustry(ind);
        if (ind && !(INDUSTRY_OPTIONS as readonly string[]).includes(ind)) {
          setIndustry('Other');
          setIndustryOther(ind);
        }

        setPrimaryRole(((p.primary_role ?? '') as any).toString());
        setYearsExperience((typeof (p as any).years_experience === 'number' ? (p as any).years_experience : null) as any);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedProfession = useMemo(() => {
    if (profession === 'Other') return professionOther.trim();
    return profession;
  }, [profession, professionOther]);

  const resolvedIndustry = useMemo(() => {
    if (!industry.trim()) return null;
    if (industry === 'Other') return industryOther.trim();
    return industry;
  }, [industry, industryOther]);

  async function next() {
    const prof = resolvedProfession.trim();
    if (!prof) {
      Alert.alert('Required', 'Please select a profession.');
      return;
    }

    setLoading(true);
    try {
      await updateMyProfile({
        profession: prof,
        industry: resolvedIndustry && resolvedIndustry.trim() ? resolvedIndustry.trim() : null,
        primary_role: primaryRole.trim() ? primaryRole.trim() : null,
        years_experience: yearsExperience,
      } as any);

      router.push('/(onboarding)/intent');
    } catch (e: any) {
      Alert.alert('Could not continue', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Button title="Back" variant="secondary" onPress={() => router.back()} />
      <Text style={styles.h1}>Your Professional Context</Text>

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

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Industry (optional)</Text>
        <View style={styles.optionsWrap}>
          {(INDUSTRY_OPTIONS as readonly string[]).map((opt) => {
            const on = industry === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setIndustry((prev) => (prev === opt ? '' : opt))}
                style={[styles.option, on && styles.optionOn]}
              >
                <Text style={[styles.optionText, on && styles.optionTextOn]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {industry === 'Other' && (
        <Input
          label="Industry (Other)"
          value={industryOther}
          onChangeText={setIndustryOther}
          placeholder="Enter your industry"
          autoCapitalize="words"
        />
      )}

      <Input
        label="Primary Role"
        value={primaryRole}
        onChangeText={setPrimaryRole}
        placeholder="e.g., Founder, Associate, Analyst"
        autoCapitalize="words"
      />

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Years of Experience</Text>
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

      <Button title="Continue" onPress={next} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginTop: 20, fontSize: 24, fontWeight: '800', color: '#1E1A14', fontFamily: 'PlayfairDisplay_700Bold' },
  label: { color: '#3A332A', marginBottom: 8, fontWeight: '700', marginTop: 6 },
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
