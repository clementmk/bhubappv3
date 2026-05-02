import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Images ──────────────────────────────────────────────────────────────────
const IMG = {
  the_climbs: require('../../assets/images/information/the_climbs.png'),
  problem_solving: require('../../assets/images/information/problem_solving.png'),
  bhub_grading: require('../../assets/images/information/bhub_grading.png'),
  bouldering101: require('../../assets/images/information/bouldering101_basics.png'),
  coaching: require('../../assets/images/information/coaching_lessons.png'),
  kilterboard: require('../../assets/images/information/kilterboard.png'),
  moonboard: require('../../assets/images/information/moonboard.png'),
  gym: require('../../assets/images/information/gym.png'),
  cafe: require('../../assets/images/information/plusone_cafe.png'),
  call_booth: require('../../assets/images/information/call_booth.png'),
};

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Do I need to book?',
    a: 'No, just walk in. We\'re open daily.',
  },
  {
    q: 'Is it kid‑friendly?',
    a: 'Suitable for kids 9+; ages 9 – 16 require guardian supervision.',
  },
  {
    q: 'Can I borrow shoes and chalk?',
    a: 'Yes, rental shoes and chalk are just RM11, making it easy to get started and enjoy your session.',
  },
  {
    q: 'How long can I climb?',
    a: 'As long as you like, day passes are full‑day.',
  },
  {
    q: 'Can I bring a pet?',
    a: "No need! We've already got cats outside the gym, you can pet those.",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
  <View style={styles.sectionHeaderWrap}>
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

const InfoCard = ({
  icon,
  title,
  body,
  image,
  linkLabel,
}: {
  icon: string;
  title: string;
  body: string;
  image?: any;
  linkLabel?: string;
}) => (
  <View style={styles.infoCard}>
    <View style={styles.cardTitleRow}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardBody}>{body}</Text>
    {image && <Image source={image} style={styles.cardImage} resizeMode="cover" />}
    {linkLabel && (
      <TouchableOpacity>
        <Text style={styles.cardLink}>{linkLabel} ↗</Text>
      </TouchableOpacity>
    )}
  </View>
);

const PricingCard = ({
  title,
  price,
  lines,
  popular,
  highlight,
}: {
  title: string;
  price: string;
  lines: { bold?: string; text: string }[];
  popular?: boolean;
  highlight?: boolean;
}) => (
  <View style={[styles.pricingCard, highlight && styles.pricingCardHighlight]}>
    {popular && (
      <View style={styles.popularBadge}>
        <Text style={styles.popularText}>Popular</Text>
      </View>
    )}
    <Text style={styles.pricingTitle}>{title}</Text>
    <Text style={styles.pricingPrice}>{price}</Text>
    {lines.map((l, i) => (
      <Text key={i} style={styles.pricingLine}>
        {l.bold ? <Text style={styles.pricingBold}>{l.bold}</Text> : null}
        {l.text}
      </Text>
    ))}
  </View>
);

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggle} activeOpacity={0.85}>
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{q}</Text>
        <Text style={styles.faqChevron}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

const InformationScreen = ({ navigation }: any) => {
  const openMap = () => {
    const address = '4, Lorong 51a/227c, Seksyen 51a, 46100 Petaling Jaya, Selangor';
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Information</Text>
      <Text style={styles.pageSubtitle}>Everything you need to know about BHub</Text>

      {/* ── First Timer ──────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="☆" title="First Timer?" />
        <Text style={styles.introText}>
          <Text style={styles.introBold}>What is bouldering? </Text>
          Bouldering is a friendly, social sport that gives you a full‑body workout and sharpens
          your mind while you connect with others and have fun solving climbing challenges.
        </Text>

        {/* 3‑column row scrollable */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
          <InfoCard
            icon="⛰"
            title="The Climbs"
            body="~80 problems rotated every ~5 weeks by our in‑house setters."
            image={IMG.the_climbs}
          />
          <InfoCard
            icon="💡"
            title="Problem Solving"
            body='Each climb has a "beta". Need help? Ask our crew for tips.'
            image={IMG.problem_solving}
          />
          <InfoCard
            icon="🔒"
            title="BHub Grading"
            body="Follow the hold color and finish in control. Grades: B1 → Beast Tag. Wild Cards too!"
            image={IMG.bhub_grading}
          />
        </ScrollView>
      </View>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="🗂" title="Pricing & Membership" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
          <PricingCard
            title="Trial Pack"
            price="RM62"
            popular
            highlight
            lines={[
              { text: '2 entry passes' },
              { bold: 'Includes shoe rentals ', text: 'for both passes' },
              { text: 'Great for first timers' },
            ]}
          />
          <PricingCard
            title="Day Pass"
            price="RM24 – 40"
            lines={[
              { bold: 'Peak RM40', text: ' · Weekdays 4 – 9pm (All day Weekends & PH)' },
              { bold: 'Off-Peak RM30', text: ' · Weekdays 11am – 4pm & 9 – 11pm' },
              { bold: 'Youth RM24', text: ' · Weekdays · 9-16 yrs · guardian required' },
            ]}
          />
          <PricingCard
            title="10‑Day Pass"
            price="RM350"
            lines={[
              { text: 'Unlimited sharing (host present)' },
              { text: 'Valid 1 year' },
              { text: 'Rental shoes' },
            ]}
          />
        </ScrollView>

        <Text style={styles.subSectionLabel}>🗂 Membership</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
          <PricingCard
            title="1 Month"
            price="RM208"
            lines={[
              { text: 'Unlimited entries for 30 days' },
              { text: 'All-day access' },
              { text: 'RM198 promo' },
              { text: 'Admin fee RM100' },
            ]}
          />
          <PricingCard
            title="3 Months"
            price="RM558"
            popular
            highlight
            lines={[
              { text: 'Unlimited entries for 90 days' },
              { text: 'Great for weekly training' },
              { text: 'RM588 promo' },
            ]}
          />
          <PricingCard
            title="6 Months"
            price="RM1,018"
            lines={[
              { text: 'Unlimited entries for 365 days' },
              { text: 'Best value for regulars' },
              { text: 'RM1,988 promo' },
            ]}
          />
        </ScrollView>

        {/* Team Package */}
        <View style={styles.teamCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIcon}>🗂</Text>
            <Text style={styles.cardTitle}>Team Building / Company Package</Text>
          </View>
          <Text style={styles.cardBody}>
            Private group booking for companies: a customised intro workshop and guided bouldering
            session, scheduled and tailored with our team. Ideal for team bonding or wellness
            activities.
          </Text>
          <Text style={styles.teamNote}>
            *Details (time, capacity, add-ons) are confirmed with our staff upon enquiry.
          </Text>
          <TouchableOpacity style={styles.enquireBtn}>
            <Text style={styles.enquireBtnText}>Enquire now →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Gear Rentals ─────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="🗂" title="Gear Rentals" />
        <View style={styles.gearRow}>
          <View style={[styles.gearCard, { flex: 1, marginRight: 8 }]}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>⛰</Text>
              <Text style={styles.cardTitle}>Climbing Shoes</Text>
            </View>
            <Text style={styles.gearPrice}>RM11</Text>
            <Text style={styles.gearNote}>Rental shoes (socks required)</Text>
          </View>
          <View style={[styles.gearCard, { flex: 1, marginLeft: 8 }]}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>🗂</Text>
              <Text style={styles.cardTitle}>Chalk Bag</Text>
            </View>
            <Text style={styles.gearPrice}>RM11</Text>
            <Text style={styles.gearNote}>Loose chalk/chalk ball friendly</Text>
          </View>
        </View>
      </View>

      {/* ── Programs ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="📖" title="Programs" subtitle="Learn the basics or sharpen your skills." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
          <InfoCard
            icon="💬"
            title="Bouldering 101: The Basics"
            body="Beginner class covering safety, movement and etiquette, feel confident and start climbing."
            image={IMG.bouldering101}
            linkLabel="Book coaching"
          />
          <InfoCard
            icon="👥"
            title="Coaching Lessons"
            body="Learn from top coaches in Malaysia; personalise your progression and break plateaus."
            image={IMG.coaching}
            linkLabel="Book coaching"
          />
        </ScrollView>
      </View>

      {/* ── Facilities ───────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader
          icon="🗂"
          title="Facilities"
          subtitle="Training boards, gym area, café and work booths."
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
          <InfoCard
            icon="📟"
            title="Kilter Board"
            body="Illuminated holds via app & LED; train on pinches, crimps, slopers and more."
            image={IMG.kilterboard}
          />
          <InfoCard
            icon="🌙"
            title="MoonBoard 2024"
            body="Improve grip, contact and pulling power with near-infinite problems."
            image={IMG.moonboard}
          />
          <InfoCard
            icon="🔊"
            title="Gym Equipment"
            body="Well-equipped fitness area to support your climbing training."
            image={IMG.gym}
          />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
          <InfoCard
            icon="🍵"
            title="PlusOne Café"
            body="Coffee, snacks and meals to fuel before or after a session."
            image={IMG.cafe}
          />
          <InfoCard
            icon="📞"
            title="Call & Meeting Booths"
            body="Quiet booths ideal for calls or work — great for freelancers or remote workers."
            image={IMG.call_booth}
          />
        </ScrollView>
      </View>

      {/* ── FAQs ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="❓" title="FAQs" />
        {FAQS.map((f, i) => (
          <FaqItem key={i} q={f.q} a={f.a} />
        ))}
      </View>

      {/* ── Visit Us ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader icon="📍" title="Visit Us" />

        <View style={styles.visitCard}>
          <Text style={styles.visitAddress}>
            4, Lorong 51a/227c, Seksyen 51a, 46100 Petaling Jaya, Selangor
          </Text>

          {/* Google Maps Link Button */}
          <TouchableOpacity style={styles.mapBtn} onPress={openMap} activeOpacity={0.85}>
            <Text style={styles.mapBtnText}>📍  Open in Google Maps</Text>
          </TouchableOpacity>

          {/* Hours */}
          <View style={styles.hoursBlock}>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Mon – Fri</Text>
              <Text style={styles.hoursTime}>11:00 – 23:00</Text>
            </View>
            <View style={styles.hoursDivider} />
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sat, Sun, PH</Text>
              <Text style={styles.hoursTime}>09:00 – 20:00</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const CARD_W = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: Spacing.xxxl },

  backBtn: { marginBottom: Spacing.base },
  backText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },

  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },

  // Section
  section: { marginBottom: Spacing.xxl },

  sectionHeaderWrap: { marginBottom: Spacing.base },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionIcon: { fontSize: 20, color: Colors.primary, marginRight: 8 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  sectionSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginLeft: 28 },

  // Intro
  introText: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.base, lineHeight: 22 },
  introBold: { color: Colors.text, fontWeight: '700' },

  // Card row
  cardRow: { marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl, paddingBottom: 8 },

  // Info card
  infoCard: {
    width: CARD_W,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardIcon: { fontSize: 18, color: Colors.primary, marginRight: 6 },
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, flex: 1 },
  cardBody: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  cardLink: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm, marginTop: Spacing.sm },

  // Pricing card
  pricingCard: {
    width: CARD_W,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  pricingCardHighlight: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  popularBadge: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 6,
  },
  popularText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  pricingTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  pricingPrice: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary, marginBottom: 8 },
  pricingLine: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 3, lineHeight: 18 },
  pricingBold: { fontWeight: '700', color: Colors.text },

  subSectionLabel: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.text,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },

  // Team card
  teamCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  enquireBtn: {
    marginTop: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  enquireBtnText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '700' },

  // Gear
  gearRow: { flexDirection: 'row' },
  gearCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  gearPrice: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary, marginVertical: 4 },
  gearNote: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // FAQ
  faqItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 12 },
  faqChevron: { fontSize: 12, color: Colors.primary },
  faqA: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },

  // Visit Us
  visitCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  visitAddress: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
    lineHeight: 22,
  },
  mapBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadow.orange,
  },
  mapBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.base },

  hoursBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  hoursDay: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600' },
  hoursTime: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  hoursDivider: { height: 1, backgroundColor: Colors.border },
});

export default InformationScreen;
