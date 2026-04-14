import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '../../src/api/client';

export default function ManageUsers() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => usersAPI.getAll({ limit: 100 }).then(res => res.data),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => usersAPI.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      Alert.alert('Success', 'User role updated');
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      Alert.alert('Success', 'User deleted');
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
    },
  });

  const users = data?.users || [];

  const handleUpdateRole = (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Update Role',
      `Change user role to "${newRole}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => updateRoleMutation.mutate({ id, role: newRole }) 
        },
      ]
    );
  };

  const handleDelete = (id, email) => {
    if (email === 'admin@leaselink.com') {
      Alert.alert('Error', 'Cannot delete admin user');
      return;
    }
    
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id) 
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-5 pt-12">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-500">← Back</Text>
          </TouchableOpacity>
          <Text className="text-gray-800 text-xl font-bold">Manage Users</Text>
          <View className="w-16" />
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View className="px-5 py-3">
            <View className="bg-white rounded-xl p-4 flex-row items-center">
              <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center">
                <Text className="text-xl">👤</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-semibold">{item.name}</Text>
                <Text className="text-gray-500 text-sm">{item.email}</Text>
                <View className="flex-row items-center mt-1">
                  <Text className={`text-xs px-2 py-1 rounded-full ${
                    item.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.role}
                  </Text>
                </View>
              </View>
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => handleUpdateRole(item._id, item.role)}
                  className="bg-primary-100 px-3 py-2 rounded-lg"
                >
                  <Text className="text-primary-600 text-xs font-medium">
                    {item.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </Text>
                </TouchableOpacity>
                {item.email !== 'admin@leaselink.com' && (
                  <TouchableOpacity
                    onPress={() => handleDelete(item._id, item.email)}
                    className="bg-red-100 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-red-600 text-xs font-medium">Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-500">No users found</Text>
          </View>
        }
      />
    </View>
  );
}
