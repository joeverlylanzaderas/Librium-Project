from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import requests
import os
import re

from .models import KnowledgeBase, ChatMessage
from .serializers import KnowledgeBaseSerializer, ChatMessageSerializer
from library.permissions import IsAdminOrLibrarian
from circulation.models import Loan, Fine, LOAN_PERIOD_DAYS, FINE_RATE_PER_DAY


# ─────────────────────────────────────────────
#  KNOWLEDGE BASE
# ─────────────────────────────────────────────

class KnowledgeBaseView(ListCreateAPIView):
    queryset           = KnowledgeBase.objects.all()
    serializer_class   = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrLibrarian]


# ─────────────────────────────────────────────
#  CHATBOT
# ─────────────────────────────────────────────

class ChatbotAPIView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes   = [UserRateThrottle]

    def get_session_id(self, request):
        if request.user.is_authenticated:
            return f"user_{request.user.id}"
        return None

    def post(self, request):
        user_message = request.data.get("message", "").strip()
        session_id   = self.get_session_id(request)

        if not user_message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save user message
        user_chat = ChatMessage.objects.create(
            role='user',
            message=user_message,
            session_id=session_id,
            user=request.user
        )

        # Fetch conversation history for context
        history_qs = ChatMessage.objects.filter(
            session_id=session_id
        ).order_by('-created_at')[:10]

        history_messages = [
            {'role': msg.role, 'content': msg.message}
            for msg in reversed(list(history_qs))
        ]

        # Build knowledge base context
        knowledge_items = KnowledgeBase.objects.all()
        context = ""
        for item in knowledge_items:
            if item.text_content:
                context += f"- **{item.title}**: {item.text_content}\n\n"

        # Build system prompt with user context
        user        = request.user
        loans       = Loan.objects.filter(member=user).exclude(
                          return_status='verified'
                      ).select_related('book')
        fines       = Fine.objects.filter(member=user, paid=False)

        system_prompt = f"""You are Libi, the Librium University Library assistant.
Loan duration: {LOAN_PERIOD_DAYS} days. Fine rate: ₱{FINE_RATE_PER_DAY}/day.
Logged-in user: {user.full_name}
Active loans: {[f"{l.book.title} due {l.due_date}" for l in loans]}
Unpaid fines: ₱{sum(f.amount for f in fines)}
Answer helpfully and concisely. You cannot approve loans or waive fines.

Library Knowledge Base:
{context if context else "No specific policies found."}"""

        user_prompt = f"User Question: {user_message}\n\nAnswer directly and concisely:"

        GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

        if not GROQ_API_KEY:
            ai_response = "AI service is unavailable. Please try again later."
        else:
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            *history_messages,
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens":  500
                    },
                    timeout=10
                )

                if response.status_code == 200:
                    data        = response.json()
                    ai_response = data['choices'][0]['message']['content']
                    ai_response = re.sub(r'<[^>]+>', '', ai_response)
                else:
                    ai_response = "Sorry, I couldn't process your question. Please try again."

            except requests.Timeout:
                ai_response = "Request timed out. Please try again."
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Chatbot error: {str(e)}", exc_info=True)
                ai_response = "An error occurred. Please try again later."

        ai_chat = ChatMessage.objects.create(
            role='assistant',
            message=ai_response,
            session_id=session_id,
            user=request.user
        )

        return Response({
            "user":      ChatMessageSerializer(user_chat).data,
            "assistant": ChatMessageSerializer(ai_chat).data,
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        session_id = self.get_session_id(request)
        messages   = ChatMessage.objects.filter(
            session_id=session_id
        ).order_by('-created_at')[:50]

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)