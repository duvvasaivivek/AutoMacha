from rest_framework import serializers
from .models import Destination


class DestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ('id', 'name', 'description')


class SavedDestinationSerializer(serializers.ModelSerializer):
    destination_details = DestinationSerializer(source='destination', read_only=True)

    class Meta:
        from .models import SavedDestination
        model = SavedDestination
        fields = ('id', 'destination', 'destination_details', 'label', 'created_at')
        read_only_fields = ('id', 'created_at')
