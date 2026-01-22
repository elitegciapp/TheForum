import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Room } from '../lib/rooms';

export function RoomListItem(props: {
  room: Room;
  isActive: boolean;
  isStarred: boolean;
  variant: 'favorites' | 'joined';
  onPress: () => void;
  onToggleStar: () => void;
}) {
  const { room, isActive, isStarred, variant, onPress, onToggleStar } = props;
  const isFavoritesRow = variant === 'favorites';
  const [rowHovered, setRowHovered] = useState(false);
  const [starHovered, setStarHovered] = useState(false);

  return (
    <View style={[styles.row, isActive && styles.rowActive]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setRowHovered(true)}
        onHoverOut={() => setRowHovered(false)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.main, rowHovered && styles.mainHovered, pressed && styles.mainPressed]}
      >
        {isFavoritesRow ? (
          <View style={[styles.favoriteIcon, isActive && styles.favoriteIconActive]}>
            <Text style={[styles.favoriteIconText, isActive && styles.favoriteIconTextActive]}>★</Text>
          </View>
        ) : (
          <View style={[styles.avatar, isActive && styles.avatarActive]}>
            <Text style={[styles.avatarText, isActive && styles.avatarTextActive]}>{initials(room.name)}</Text>
          </View>
        )}

        <View style={styles.textCol}>
          <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
            {room.name}
          </Text>
          {!isFavoritesRow && (
            <Text style={styles.desc} numberOfLines={1}>
              {room.description}
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleStar}
        onHoverIn={() => setStarHovered(true)}
        onHoverOut={() => setStarHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={isStarred ? 'Unfavorite room' : 'Favorite room'}
        style={({ pressed }) => [styles.starBtn, starHovered && styles.starBtnHovered, pressed && styles.starBtnPressed]}
      >
        <Text style={[styles.star, isStarred && styles.starOn]}>{isStarred ? '★' : '☆'}</Text>
      </Pressable>
    </View>
  );
}

function initials(name: string) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? 'R';
  const b = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
  return `${a}${b}`.toUpperCase();
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DED3',
  },
  rowActive: {
    backgroundColor: '#FFFFFF',
  },

  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
    borderRadius: 12,
    marginVertical: 4,
    marginLeft: 4,
  },
  mainHovered: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  mainPressed: {
    opacity: 0.85,
  },

  textCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#1E1A14',
    fontWeight: '800',
  },
  nameActive: {
    color: '#1E1A14',
  },
  desc: {
    marginTop: 2,
    color: '#6B6257',
  },

  starBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 6,
  },
  starBtnHovered: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
  },
  starBtnPressed: {
    opacity: 0.85,
  },
  star: {
    fontSize: 18,
    color: '#6B6257',
    fontWeight: '900',
  },
  starOn: {
    color: '#1E1A14',
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: '#1E1A14',
    borderColor: '#1E1A14',
  },
  avatarText: {
    color: '#1E1A14',
    fontWeight: '900',
    fontSize: 12,
  },
  avatarTextActive: {
    color: '#FFFFFF',
  },

  favoriteIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D1C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIconActive: {
    backgroundColor: '#1E1A14',
    borderColor: '#1E1A14',
  },
  favoriteIconText: {
    color: '#1E1A14',
    fontWeight: '900',
    fontSize: 14,
  },
  favoriteIconTextActive: {
    color: '#FFFFFF',
  },
});
